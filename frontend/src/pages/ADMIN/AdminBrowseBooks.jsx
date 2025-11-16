import { useEffect, useState } from "react";
import api from "../../lib/axios";
import Header from "../../components/Header";
import SideBar from "../../components/SideBar";


export default function AdminBrowseBooks() {
  const [books, setBooks] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [newBook, setNewBook] = useState({
    title: "",
    author: "",
    category: "",
    totalCopies: "",
  });

  useEffect(() => {
    const fetchBooks = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await api.get("/admin/books");
        setBooks(res.data || []);
      } catch (error) {
        setError("Failed to load books list.", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  const handleSearchChange = (e) => {
    setSearch(e.target.value);
  };

  const handleNewBookChange = (e) => {
    const { name, value } = e.target;
    setNewBook((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddBook = async (e) => {
    e.preventDefault();
    setError("");

    if (
      !newBook.title ||
      !newBook.author ||
      !newBook.category ||
      !newBook.totalCopies
    ) {
      setError("Please fill in all book fields.");
      return;
    }

    const totalCopiesNumber = Number(newBook.totalCopies);
    if (Number.isNaN(totalCopiesNumber) || totalCopiesNumber <= 0) {
      setError("Total copies must be a positive integer.");
      return;
    }

    try {
      const res = await api.post("/admin/books", {
        title: newBook.title,
        author: newBook.author,
        category: newBook.category,
        totalCopies: totalCopiesNumber,
      });

      if (res.data) {
        setBooks((prev) => [res.data, ...prev]);
      }

      setNewBook({
        title: "",
        author: "",
        category: "",
        totalCopies: "",
      });
    } catch (error) {
      setError("Failed to add new book.", error);
    }
  };

  const handleDeleteBook = async (id) => {
    const ok = window.confirm("Are you sure you want to delete this book?");
    if (!ok) return;

    setError("");
    try {
      await api.delete(`/admin/books/${id}`);
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } catch (error) {
      setError("Failed to delete book.", error);
    }
  };

  const filteredBooks = books.filter((b) => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return true;
    const title = b.title?.toLowerCase() || "";
    const author = b.author?.toLowerCase() || "";
    const category = (b.genre || "").toLowerCase(); // backend trả genre
    return (
      title.includes(keyword) ||
      author.includes(keyword) ||
      category.includes(keyword)
    );
  });

  return (
    <div className="appMain">
      <Header />
      <div className="mainContentWrapper">
        <SideBar />
        <div className="admin-container">
          <h2 className="admin-title">Browse Books</h2>

          <div className="admin-topbar">
            <input
              type="text"
              className="admin-search"
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by title, author, or category"
            />

            <form className="admin-add-form" onSubmit={handleAddBook}>
              <input
                type="text"
                name="title"
                value={newBook.title}
                onChange={handleNewBookChange}
                placeholder="Title"
              />
              <input
                type="text"
                name="author"
                value={newBook.author}
                onChange={handleNewBookChange}
                placeholder="Author"
              />
              <input
                type="text"
                name="category"
                value={newBook.category}
                onChange={handleNewBookChange}
                placeholder="Category / Genre"
              />
              <input
                type="number"
                name="totalCopies"
                value={newBook.totalCopies}
                onChange={handleNewBookChange}
                placeholder="Total copies"
              />
              <button className="admin-btn-add" type="submit">
                Add Book
              </button>
            </form>
          </div>

          {error && <p className="admin-error">{error}</p>}

          {loading ? (
            <p>Loading books...</p>
          ) : filteredBooks.length === 0 ? (
            <p>No books found.</p>
          ) : (
            <div className="admin-table-wrapper">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th align="left">Title</th>
                    <th align="left">Author</th>
                    <th align="left">Category</th>
                    <th align="left">Available copies</th>
                    <th align="left">Total copies</th>
                    <th align="left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((b) => (
                    <tr key={b.id}>
                      <td>{b.title}</td>
                      <td>{b.author}</td>
                      <td>{b.genre}</td>
                      <td>{b.availableCopies ?? b.totalCopies}</td>
                      <td>{b.totalCopies}</td>
                      <td>
                        <button
                          className="admin-btn-delete"
                          onClick={() => handleDeleteBook(b.id)}
                        >
                          x
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
