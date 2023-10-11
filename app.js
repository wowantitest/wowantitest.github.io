const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const app = express();
const port = process.env.PORT || 3000;


app.set('view engine', 'ejs');
const path = require('path'); // Добавьте эту строку

app.use(express.static(path.join(__dirname, 'public')));

const db = new sqlite3.Database('./mydatabase.db', (err) => {
  if (err) {
    console.error('Ошибка при подключении к базе данных:', err.message);
  } else {
    console.log('Подключено к базе данных SQLite');
  }
});

app.post('/add_product', (req, res) => {
  const name = req.body.name;
  const quantity = parseInt(req.body.quantity);
  const cost = parseFloat(req.body.cost);

  // Проверка наличия всех необходимых данных
  if (!name || isNaN(quantity) || isNaN(cost)) {
    return res.status(400).send('Неверные данные товара.');
  }

  // Выполним SQL-запрос для добавления товара в базу данных
  const sql = 'INSERT INTO products (name, quantity, cost) VALUES (?, ?, ?)';
  const values = [name, quantity, cost];

  db.run(sql, values, function (err) {
    if (err) {
      console.error('Ошибка при добавлении товара:', err.message);
      return res.status(500).send('Ошибка сервера.');
    }
    console.log('Товар успешно добавлен с ID:', this.lastID);
  // Перенаправление на страницу со списком товаров
    res.redirect('/show_products');
    });
}); 





app.get('/show_products', (req, res) => {
  // Выполним SQL-запрос для получения списка товаров
  db.all('SELECT * FROM products', [], (err, rows) => {
    if (err) {
      console.error('Ошибка при получении списка товаров:', err.message);
      return res.status(500).send('Ошибка сервера.');
    }

    // Отображение шаблона для отображения товаров
    res.render('products', { products: rows });
  });
});




app.post('/add_transaction', (req, res) => {
  const date = req.body.date;
    const type = req.body.type;
    const productName = req.body.product_name;
    const quantity = parseInt(req.body.quantity);
    const cost = parseFloat(req.body.cost);
  
    // Проверка наличия всех необходимых данных
    if (!date || !type || !productName || isNaN(quantity) || isNaN(cost)) {
      return res.status(400).send('Неверные данные транзакции.');
    }
  
    // Получим ID товара на основе его имени
    db.get('SELECT id FROM products WHERE name = ?', [productName], (err, product) => {
      if (err) {
        console.error('Ошибка при поиске товара:', err.message);
        return res.status(500).send('Ошибка сервера.');
      }
  
      if (!product) {
        return res.status(400).send('Товар не найден.');
      }
  
      const productId = product.id;
  
      // Выполним SQL-запрос для добавления транзакции
      const sql = 'INSERT INTO transactions (date, type, product_id, quantity, cost) VALUES (?, ?, ?, ?, ?)';
      const values = [date, type, productId, quantity, cost];
  
      db.run(sql, values, function (err) {
        if (err) {
          console.error('Ошибка при добавлении транзакции:', err.message);
          return res.status(500).send('Ошибка сервера.');
        }
        console.log('Транзакция успешно добавлена с ID:', this.lastID);
  
  // Перенаправление на страницу со списком транзакций
  res.redirect('/show_transactions');
        });
    });
});




app.get('/show_transactions', (req, res) => {
  // Выполним SQL-запрос для получения списка транзакций
  db.all('SELECT transactions.id, transactions.date, transactions.type, products.name AS product_name, transactions.quantity, transactions.cost FROM transactions INNER JOIN products ON transactions.product_id = products.id', [], (err, transactionRows) => {
    if (err) {
      console.error('Ошибка при получении списка транзакций:', err.message);
      return res.status(500).send('Ошибка сервера.');
    }

    // Далее выполните SQL-запрос для получения списка товаров (products)
    db.all('SELECT * FROM products', [], (err, productRows) => {
      if (err) {
        console.error('Ошибка при получении списка товаров:', err.message);
        return res.status(500).send('Ошибка сервера.');
      }

      // Отображение шаблона для отображения транзакций и передача переменных transactions и products
      res.render('transactions', { transactions: transactionRows, products: productRows });
    });
  });
});



app.post('/add_financial_operation', (req, res) => {
  const date = req.body.date;
  const operationType = req.body.operation_type;
  const amount = parseFloat(req.body.amount);
  const comment = req.body.comment;

  // Проверка наличия всех необходимых данных
  if (!date || !operationType || isNaN(amount)) {
    return res.status(400).send('Неверные данные финансовой операции.');
  }

  // Выполним SQL-запрос для добавления финансовой операции
  const sql = 'INSERT INTO financial_operations (date, operation_type, amount, comment) VALUES (?, ?, ?, ?)';
  const values = [date, operationType, amount, comment];

  db.run(sql, values, function (err) {
    if (err) {
      console.error('Ошибка при добавлении финансовой операции:', err.message);
      return res.status(500).send('Ошибка сервера.');
    }
    console.log('Финансовая операция успешно добавлена с ID:', this.lastID);

    // Перенаправление на страницу с отфильтрованными финансовыми операциями или другую страницу по вашему выбору
    res.redirect('/show_financial_operations');
  });
});



// Маршрут для отображения всех финансовых операций
app.get('/show_financial_operations', (req, res) => {
  // Выполним SQL-запрос для получения списка финансовых операций
  db.all('SELECT * FROM financial_operations', [], (err, financialRows) => {
      if (err) {
          console.error('Ошибка при получении списка финансовых операций:', err.message);
          return res.status(500).send('Ошибка сервера.');
      }

      // Отображение шаблона для отображения финансовых операций и передача переменной financial_operations
      res.render('financial', { financial_operations: financialRows });
  });
});





// Маршрут для обработки формы фильтрации финансовых операций
app.get('/filter_financial_operations', (req, res) => {
  const { operation_type, start_date, end_date } = req.query;

  // Преобразование параметров даты в объекты Date (если они были переданы)
  const startDate = start_date ? new Date(start_date) : null;
  const endDate = end_date ? new Date(end_date) : null;

  // Выполнение SQL-запроса для получения финансовых операций с учетом фильтров
  let sql = `
    SELECT * FROM financial_operations
    WHERE (:operation_type IS NULL OR operation_type = :operation_type)
    AND (:start_date IS NULL OR date >= :start_date)
    AND (:end_date IS NULL OR date <= :end_date)
  `;
  
  const params = {
    ':start_date': startDate,
    ':end_date': endDate
  };
  
  if (operation_type !== 'all') {
    sql += ' AND (:operation_type IS NULL OR operation_type = :operation_type)';
    params[':operation_type'] = operation_type;
  }

  db.all(sql, params, (err, filteredFinancialOperations) => {
    if (err) {
      console.error('Ошибка при получении финансовых операций:', err.message);
      return res.status(500).send('Ошибка сервера.');
    }

    // Отображение шаблона для отображения отфильтрованных финансовых операций и передача данных
    res.render('financial', { financial_operations: filteredFinancialOperations });
  });
});


app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  // Выполните SQL-запросы, чтобы получить данные из таблиц
  db.all('SELECT * FROM products', [], (err, products) => {
    if (err) {
      console.error('Ошибка при получении списка товаров:', err.message);
      return res.status(500).send('Ошибка сервера.');
    }

    db.all('SELECT * FROM transactions', [], (err, transactions) => {
      if (err) {
        console.error('Ошибка при получении списка транзакций:', err.message);
        return res.status(500).send('Ошибка сервера.');
      }

      db.all('SELECT * FROM financial_operations', [], (err, financialOperations) => {
        if (err) {
          console.error('Ошибка при получении списка финансовых операций:', err.message);
          return res.status(500).send('Ошибка сервера.');
        }

        // Рендерим EJS-шаблон index.ejs и передаем данные
        res.render('index', {
          products: products,
          transactions: transactions,
          financialOperations: financialOperations
        });
      });
    });
  });
});








// Запуск сервера
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
