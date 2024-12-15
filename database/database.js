const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Create database connection
const dbPath = path.resolve(__dirname, 'bookstore.db');
const db = new sqlite3.Database(dbPath);

// Create tables
db.serialize(() => {
  // Authors Table
  db.run(`CREATE TABLE IF NOT EXISTS Authors (
    AuthorID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL
  )`);

  // Genres Table
  db.run(`CREATE TABLE IF NOT EXISTS Genres (
    GenreID INTEGER PRIMARY KEY AUTOINCREMENT,
    Name TEXT NOT NULL,
    Description TEXT
  )`);

  // Books Table
  db.run(`CREATE TABLE IF NOT EXISTS Books (
    BookID INTEGER PRIMARY KEY AUTOINCREMENT,
    Title TEXT NOT NULL,
    AuthorID INTEGER,
    GenreID INTEGER,
    Pages INTEGER,
    PublishedDate DATE,
    FOREIGN KEY(AuthorID) REFERENCES Authors(AuthorID),
    FOREIGN KEY(GenreID) REFERENCES Genres(GenreID)
  )`);

  // Sample data insertion functions
  const insertAuthor = (name) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO Authors (Name) VALUES (?)`, [name], function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
    });
  };

  const insertGenre = (name, description) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO Genres (Name, Description) VALUES (?, ?)`, [name, description], function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
    });
  };

  const insertBook = (title, authorId, genreId, pages, publishedDate) => {
    return new Promise((resolve, reject) => {
      db.run(`INSERT INTO Books (Title, AuthorID, GenreID, Pages, PublishedDate) 
              VALUES (?, ?, ?, ?, ?)`, 
              [title, authorId, genreId, pages, publishedDate], function(err) {
        if (err) reject(err);
        resolve(this.lastID);
      });
    });
  };

  // Seed initial data
  Promise.all([
    insertAuthor('J.K. Rowling'),
    insertAuthor('George Orwell'),
    insertGenre('Fantasy', 'Imaginative fiction involving magic'),
    insertGenre('Dystopian', 'Fictional societies with oppressive social control')
  ]).then(([authorId1, authorId2, genreId1, genreId2]) => {
    insertBook('Harry Potter and the Philosopher\'s Stone', authorId1, genreId1, 223, '1997-06-26');
    insertBook('1984', authorId2, genreId2, 328, '1949-06-08');
  });
});

module.exports = db;