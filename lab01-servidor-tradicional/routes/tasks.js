const express = require('express');
const { v4: uuidv4 } = require('uuid');
const Task = require('../models/Task');
const database = require('../database/database');
const { authMiddleware } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const { userRateLimiter } = require('../middleware/rateLimiter');
const cache = require('memory-cache');

const router = express.Router();

// Todas as rotas requerem autenticação
router.use(authMiddleware);
router.use(userRateLimiter);

const clearUserTaskCache = (userId) => {
    const keys = cache.keys();
    keys.forEach(key => {
        if (key.startsWith(`tasks_user_${userId}`)) {
            cache.del(key);
            console.log(`Cache cleared for key: ${key}`);
        }
    });
};

// Listar tarefas
router.get('/', async (req, res) => {

    // 1. Criar uma chave de cache única baseada no ID do usuário e nos query params
    const cacheKey = `tasks_user_${req.user.id}_${JSON.stringify(req.query)}`;

    // 2. Tenta obter os dados do cache
    const cachedData = cache.get(cacheKey);
    if (cachedData) {
        console.log(`Cache HIT para a chave: ${cacheKey}`);
        return res.json(cachedData);
    }

    console.log(`Cache MISS para a chave: ${cacheKey}`);

    try {
        const { completed, priority } = req.query;
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const { startDate, endDate } = req.query;

        let sql = 'SELECT * FROM tasks WHERE userId = ?';
        let countSql = 'SELECT COUNT(*) as total FROM tasks WHERE userId = ?';
        const params = [req.user.id];
        const countParams = [req.user.id];


        if (completed !== undefined) {
            sql += ' AND completed = ?';
            countSql += ' AND completed = ?';
            const completedValue = completed === 'true' ? 1 : 0;
            params.push(completedValue);
            countParams.push(completedValue);
        }

        if (priority) {
            sql += ' AND priority = ?';
            countSql += ' AND priority = ?';
            params.push(priority);
            countParams.push(priority);
        }

        if (startDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
                return res.status(400).json({ success: false, message: 'Formato de startDate inválido. Use YYYY-MM-DD.' });
            }
            // Adiciona a condição para a data de início (>=) tanto na query de dados quanto na de contagem.
            sql += ' AND createdAt >= ?';
            countSql += ' AND createdAt >= ?';
            // Adiciona a hora para garantir que o dia inteiro seja incluído.
            params.push(`${startDate} 00:00:00`);
            countParams.push(`${startDate} 00:00:00`);
        }

        if (endDate) {
            if (!/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
                return res.status(400).json({ success: false, message: 'Formato de endDate inválido. Use YYYY-MM-DD.' });
            }
            // Adiciona a condição para a data de fim (<=) em ambas as queries.
            sql += ' AND createdAt <= ?';
            countSql += ' AND createdAt <= ?';
            // Adiciona a hora para garantir que o dia inteiro seja incluído.
            params.push(`${endDate} 23:59:59`);
            countParams.push(`${endDate} 23:59:59`);
        }


        sql += ' ORDER BY createdAt DESC LIMIT ? OFFSET ?';
        params.push(limit, offset);

        const [rows, totalResult] = await Promise.all([
            database.all(sql, params),
            database.get(countSql, countParams)
        ]);

        const tasks = rows.map(row => new Task({ ...row, completed: row.completed === 1 }));
        const totalItems = totalResult.total;
        const totalPages = Math.ceil(totalItems / limit);

        const responseData = {
            success: true,
            data: tasks.map(task => task.toJSON()),
            meta: {
                totalItems,
                totalPages,
                currentPage: page,
                itemsPerPage: limit
            }
        };

        cache.put(cacheKey, responseData, 300000);

        res.json(responseData);

    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Criar tarefa
router.post('/', validate('task'), async (req, res) => {
    try {
        const taskData = {
            id: uuidv4(),
            ...req.body,
            userId: req.user.id
        };

        const task = new Task(taskData);
        const validation = task.validate();

        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                message: 'Dados inválidos',
                errors: validation.errors
            });
        }

        await database.run(
            'INSERT INTO tasks (id, title, description, priority, userId) VALUES (?, ?, ?, ?, ?)',
            [task.id, task.title, task.description, task.priority, task.userId]
        );

        clearUserTaskCache(req.user.id);

        res.status(201).json({
            success: true,
            message: 'Tarefa criada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Buscar tarefa por ID
router.get('/:id', validate('task'), async (req, res) => {
    try {
        const row = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (!row) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const task = new Task({ ...row, completed: row.completed === 1 });
        res.json({
            success: true,
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Atualizar tarefa
router.put('/:id', async (req, res) => {
    try {
        const { title, description, completed, priority } = req.body;

        const result = await database.run(
            'UPDATE tasks SET title = ?, description = ?, completed = ?, priority = ? WHERE id = ? AND userId = ?',
            [title, description, completed ? 1 : 0, priority, req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        const updatedRow = await database.get(
            'SELECT * FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        const task = new Task({ ...updatedRow, completed: updatedRow.completed === 1 });

        clearUserTaskCache(req.user.id);

        res.json({
            success: true,
            message: 'Tarefa atualizada com sucesso',
            data: task.toJSON()
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Deletar tarefa
router.delete('/:id', async (req, res) => {
    try {
        const result = await database.run(
            'DELETE FROM tasks WHERE id = ? AND userId = ?',
            [req.params.id, req.user.id]
        );

        if (result.changes === 0) {
            return res.status(404).json({
                success: false,
                message: 'Tarefa não encontrada'
            });
        }

        res.json({
            success: true,
            message: 'Tarefa deletada com sucesso'
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

// Estatísticas
router.get('/stats/summary', async (req, res) => {
    try {
        const stats = await database.get(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN completed = 1 THEN 1 ELSE 0 END) as completed,
                SUM(CASE WHEN completed = 0 THEN 1 ELSE 0 END) as pending
            FROM tasks WHERE userId = ?
        `, [req.user.id]);

        res.json({
            success: true,
            data: {
                ...stats,
                completionRate: stats.total > 0 ? ((stats.completed / stats.total) * 100).toFixed(2) : 0
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Erro interno do servidor' });
    }
});

module.exports = router;