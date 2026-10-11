const express = require('express');
const mysql = require('mysql2/promise');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const dbPool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'rootpass',
    charset: 'utf8mb4',
    database: process.env.DB_NAME || 'mailer_db',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER, 
        pass: process.env.GMAIL_PASS
    }
});


app.get('/', async (req, res) => {
    try {
        const [subscribers] = await dbPool.query('SELECT * FROM subscribers ORDER BY last_name ASC, first_name ASC');
        res.render('index', { subscribers, message: null });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/send', async (req, res) => {
    const { textMessage, selectedEmails } = req.body;
    
    try {
        const [subscribers] = await dbPool.query('SELECT * FROM subscribers ORDER BY last_name ASC');
        
        if (!selectedEmails) {
            return res.render('index', { subscribers, message: 'Помилка: Ви не обрали жодного отримувача.' });
        }

        const emailsArray = Array.isArray(selectedEmails) ? selectedEmails : [selectedEmails];
        
        const targetUsers = subscribers.filter(user => emailsArray.includes(user.email));

        let emailsSent = 0;
        for (const user of targetUsers) {
            const personalizedMessage = `Шановний(а) ${user.last_name} ${user.first_name} ${user.patronymic}!\n\n${textMessage}`;
            await transporter.sendMail({
                from: `"Розсилка" <${process.env.GMAIL_USER}>`,
                to: user.email,
                subject: 'Інформаційне повідомлення',
                text: personalizedMessage
            });
            emailsSent++;
        }

        res.render('index', { subscribers, message: `Успішно відправлено листів: ${emailsSent}` });
    } catch (err) {
        const [subscribers] = await dbPool.query('SELECT * FROM subscribers ORDER BY last_name ASC');
        res.render('index', { subscribers, message: `Помилка відправки: ${err.message}` });
    }
});

app.get('/manage', async (req, res) => {
    try {
        const [subscribers] = await dbPool.query('SELECT * FROM subscribers ORDER BY last_name ASC');
        res.render('manage', { subscribers });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/manage/add', async (req, res) => {
    const { last_name, first_name, patronymic, email } = req.body;
    try {
        await dbPool.query(
            'INSERT INTO subscribers (last_name, first_name, patronymic, email) VALUES (?, ?, ?, ?)',
            [last_name, first_name, patronymic, email]
        );
        res.redirect('/manage');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/manage/delete/:id', async (req, res) => {
    try {
        await dbPool.query('DELETE FROM subscribers WHERE id = ?', [req.params.id]);
        res.redirect('/manage');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.get('/manage/edit/:id', async (req, res) => {
    try {
        const [rows] = await dbPool.query('SELECT * FROM subscribers WHERE id = ?', [req.params.id]);
        if (rows.length === 0) return res.status(404).send('Користувача не знайдено');
        res.render('edit', { subscriber: rows[0] });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.post('/manage/edit/:id', async (req, res) => {
    const { last_name, first_name, patronymic, email } = req.body;
    try {
        await dbPool.query(
            'UPDATE subscribers SET last_name = ?, first_name = ?, patronymic = ?, email = ? WHERE id = ?',
            [last_name, first_name, patronymic, email, req.params.id]
        );
        res.redirect('/manage');
    } catch (err) {
        res.status(500).send(err.message);
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Сервер працює на порту ${PORT}`));