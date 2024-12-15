const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const router = express.Router();
const db = require('../database/database');

// GET all books with author and genre information
router.get('/', (req, res) => {
  const { search, genre, author } = req.query;
  let query = `
    SELECT Books.*, Authors.Name as AuthorName, Genres.Name as GenreName 
    FROM Books 
    JOIN Authors ON Books.AuthorID = Authors.AuthorID 
    JOIN Genres ON Books.GenreID = Genres.GenreID
    WHERE 1=1
  `;
  const params = [];

  if (search) {
    query += ` AND (Books.Title LIKE ? OR Authors.Name LIKE ?)`;
    params.push(`%${search}%`, `%${search}%`);
  }

  if (genre) {
    query += ` AND Genres.Name = ?`;
    params.push(genre);
  }

  if (author) {
    query += ` AND Authors.Name = ?`;
    params.push(author);
  }

  db.all(query, params, (err, books) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json(books);
  });
});

// GET book by ID
router.get('/:id', (req, res) => {
  const query = `
    SELECT Books.*, Authors.Name as AuthorName, Genres.Name as GenreName 
    FROM Books 
    JOIN Authors ON Books.AuthorID = Authors.AuthorID 
    JOIN Genres ON Books.GenreID = Genres.GenreID
    WHERE Books.BookID = ?
  `;

  db.get(query, [req.params.id], (err, book) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    if (!book) {
      res.status(404).json({ message: 'Book not found' });
      return;
    }
    res.json(book);
  });
});

// POST new book
router.post('/', (req, res) => {
  const { title, authorName, genreName, pages, publishedDate } = req.body;

  // First, find or insert author
  db.get('SELECT AuthorID FROM Authors WHERE Name = ?', [authorName], (err, author) => {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }

    const insertOrGetAuthor = (authorName) => {
      return new Promise((resolve, reject) => {
        if (author) {
          resolve(author.AuthorID);
        } else {
          db.run('INSERT INTO Authors (Name) VALUES (?)', [authorName], function(err) {
            if (err) reject(err);
            resolve(this.lastID);
          });
        }
      });
    };

    const insertOrGetGenre = (genreName) => {
      return new Promise((resolve, reject) => {
        db.get('SELECT GenreID FROM Genres WHERE Name = ?', [genreName], (err, genre) => {
          if (err) reject(err);
          if (genre) {
            resolve(genre.GenreID);
          } else {
            db.run('INSERT INTO Genres (Name) VALUES (?)', [genreName], function(err) {
              if (err) reject(err);
              resolve(this.lastID);
            });
          }
        });
      });
    };

    Promise.all([
      insertOrGetAuthor(authorName),
      insertOrGetGenre(genreName)
    ]).then(([authorId, genreId]) => {
      db.run(
        'INSERT INTO Books (Title, AuthorID, GenreID, Pages, PublishedDate) VALUES (?, ?, ?, ?, ?)', 
        [title, authorId, genreId, pages, publishedDate],
        function(err) {
          if (err) {
            res.status(500).json({ error: err.message });
            return;
          }
          res.status(201).json({ 
            message: 'Book added successfully', 
            bookId: this.lastID 
          });
        }
      );
    }).catch(err => {
      res.status(500).json({ error: err.message });
    });
  });
});

// PUT update book
router.put('/:id', (req, res) => {
  const { title, authorName, genreName, pages, publishedDate } = req.body;

  // Similar logic to POST, but with UPDATE instead of INSERT
  const updateQuery = `
    UPDATE Books 
    SET Title = ?, Pages = ?, PublishedDate = ?,
        AuthorID = (SELECT AuthorID FROM Authors WHERE Name = ?),
        GenreID = (SELECT GenreID FROM Genres WHERE Name = ?)
    WHERE BookID = ?
  `;

  db.run(
    updateQuery, 
    [title, pages, publishedDate, authorName, genreName, req.params.id],
    function(err) {
      if (err) {
        res.status(500).json({ error: err.message });
        return;
      }
      res.json({ 
        message: 'Book updated successfully', 
        changes: this.changes 
      });
    }
  );
});

// DELETE book
router.delete('/:id', (req, res) => {
  db.run('DELETE FROM Books WHERE BookID = ?', [req.params.id], function(err) {
    if (err) {
      res.status(500).json({ error: err.message });
      return;
    }
    res.json({ 
      message: 'Book deleted successfully', 
      deleted: this.changes 
    });
  });
});

module.exports = router;