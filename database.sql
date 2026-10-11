SET NAMES utf8mb4;
SET CHARACTER SET utf8mb4;

CREATE TABLE IF NOT EXISTS subscribers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    last_name VARCHAR(100) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    patronymic VARCHAR(100),
    email VARCHAR(150) NOT NULL UNIQUE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO subscribers (last_name, first_name, patronymic, email) VALUES
('Шевченко', 'Тарас', 'Григорович', 'taras@example.com'),
('Українка', 'Леся', 'Петрівна', 'lesya@example.com'),
('Франко', 'Іван', 'Якович', 'ivan@example.com');