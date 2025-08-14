// Sample initial data
const initialBooks = [
  {
    id: "1",
    title: "To Kill a Mockingbird",
    author: "Harper Lee",
    isbn: "9780061120084",
    category: "Fiction",
    status: "Available",
    addedDate: new Date("2025-01-15").toISOString(),
    borrower: null,
    dueDate: null,
  },
  {
    id: "2",
    title: "1984",
    author: "George Orwell",
    isbn: "9780451524935",
    category: "Science Fiction",
    status: "Issued",
    addedDate: new Date("2025-02-10").toISOString(),
    borrower: "John Doe",
    dueDate: new Date("2025-06-10").toISOString(),
  },
  {
    id: "3",
    title: "The Great Gatsby",
    author: "F. Scott Fitzgerald",
    isbn: "9780743273565",
    category: "Fiction",
    status: "Available",
    addedDate: new Date("2025-03-05").toISOString(),
    borrower: null,
    dueDate: null,
  },
  {
    id: "4",
    title: "Pride and Prejudice",
    author: "Jane Austen",
    isbn: "9780141439518",
    category: "Romance",
    status: "Available",
    addedDate: new Date("2025-01-20").toISOString(),
    borrower: null,
    dueDate: null,
  },
  {
    id: "5",
    title: "The Hobbit",
    author: "J.R.R. Tolkien",
    isbn: "9780547928227",
    category: "Fantasy",
    status: "Issued",
    addedDate: new Date("2025-02-15").toISOString(),
    borrower: "Jane Smith",
    dueDate: new Date("2025-06-15").toISOString(),
  },
]

// Sample initial history data
const initialHistory = [
  {
    id: "1",
    bookId: "2",
    bookTitle: "1984",
    action: "Issue",
    borrower: "John Doe",
    date: new Date("2025-05-10").toISOString(),
  },
  {
    id: "2",
    bookId: "5",
    bookTitle: "The Hobbit",
    action: "Issue",
    borrower: "Jane Smith",
    date: new Date("2025-05-15").toISOString(),
  },
]

// State management
class LibraryManager {
  constructor() {
    this.books = []
    this.history = []
    // Load data from localStorage or use initial data
    this.loadData()
  }

  loadData() {
    const savedBooks = localStorage.getItem("library_books")
    const savedHistory = localStorage.getItem("library_history")

    if (savedBooks) {
      this.books = JSON.parse(savedBooks)
    } else {
      this.books = initialBooks
    }

    if (savedHistory) {
      this.history = JSON.parse(savedHistory)
    } else {
      this.history = initialHistory
    }
  }

  saveData() {
    localStorage.setItem("library_books", JSON.stringify(this.books))
    localStorage.setItem("library_history", JSON.stringify(this.history))
  }

  getBooks() {
    return this.books
  }

  getHistory() {
    return this.history
  }

  getAvailableBooks() {
    return this.books.filter((book) => book.status === "Available")
  }

  getIssuedBooks() {
    return this.books.filter((book) => book.status === "Issued")
  }

  getBookById(id) {
    return this.books.find((book) => book.id === id)
  }

  addBook(bookData) {
    const newBook = {
      ...bookData,
      id: (this.books.length + 1).toString(),
      addedDate: new Date().toISOString(),
      status: "Available",
      borrower: null,
      dueDate: null,
    }

    this.books.push(newBook)
    this.saveData()
    return newBook
  }

  deleteBook(id) {
    const initialLength = this.books.length
    this.books = this.books.filter((book) => book.id !== id)

    if (this.books.length < initialLength) {
      this.saveData()
      return true
    }
    return false
  }

  issueBook(id, borrower, dueDate) {
    const book = this.getBookById(id)
    if (!book || book.status !== "Available") return false

    // Update book status
    book.status = "Issued"
    book.borrower = borrower
    book.dueDate = dueDate

    // Add to history
    const newHistoryRecord = {
      id: (this.history.length + 1).toString(),
      bookId: id,
      bookTitle: book.title,
      action: "Issue",
      borrower,
      date: new Date().toISOString(),
    }
    this.history.push(newHistoryRecord)

    this.saveData()
    return true
  }

  returnBook(id) {
    const book = this.getBookById(id)
    if (!book || book.status !== "Issued" || !book.borrower) return false

    const borrower = book.borrower

    // Update book status
    book.status = "Available"
    book.borrower = null
    book.dueDate = null

    // Add to history
    const newHistoryRecord = {
      id: (this.history.length + 1).toString(),
      bookId: id,
      bookTitle: book.title,
      action: "Return",
      borrower,
      date: new Date().toISOString(),
    }
    this.history.push(newHistoryRecord)

    this.saveData()
    return true
  }

  searchBooks(term) {
    if (!term.trim()) return []

    const searchTerm = term.toLowerCase()
    return this.books.filter(
      (book) =>
        book.title.toLowerCase().includes(searchTerm) ||
        book.author.toLowerCase().includes(searchTerm) ||
        book.isbn.toLowerCase().includes(searchTerm) ||
        book.category.toLowerCase().includes(searchTerm),
    )
  }

  searchHistory(term) {
    if (!term.trim()) return this.history

    const searchTerm = term.toLowerCase()
    return this.history.filter(
      (record) =>
        record.bookTitle.toLowerCase().includes(searchTerm) ||
        record.borrower.toLowerCase().includes(searchTerm) ||
        record.action.toLowerCase().includes(searchTerm),
    )
  }

  getStats() {
    return {
      totalBooks: this.books.length,
      availableBooks: this.getAvailableBooks().length,
      issuedBooks: this.getIssuedBooks().length,
      categories: new Set(this.books.map((book) => book.category)).size,
    }
  }
}

// UI Manager
class UIManager {
  constructor(library) {
    this.library = library
    this.activeTab = "dashboard"
    this.issueReturnTab = "issue"
    this.bookToDelete = null
    this.bookToReturn = null
    this.isSubmitting = false
    this.initEventListeners()
    this.renderDashboard()
    this.updateAllTabs()
  }

  initEventListeners() {
    // Tab navigation
    document.querySelectorAll(".nav-button, .tab-button").forEach((button) => {
      button.addEventListener("click", (e) => {
        const target = e.currentTarget
        const tab = target.getAttribute("data-tab")
        if (tab) {
          this.switchTab(tab)
        }
      })
    })

    // Issue/Return tabs
    document.querySelectorAll(".issue-return-tab").forEach((button) => {
      button.addEventListener("click", (e) => {
        const target = e.currentTarget
        const tab = target.getAttribute("data-tab")
        if (tab) {
          this.switchIssueReturnTab(tab)
        }
      })
    })

    // Add book form
    const addBookForm = document.getElementById("add-book-form")
    if (addBookForm) {
      addBookForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleAddBook()
      })
    }

    // Issue book form
    const issueBookForm = document.getElementById("issue-book-form")
    if (issueBookForm) {
      issueBookForm.addEventListener("submit", (e) => {
        e.preventDefault()
        this.handleIssueBook()
      })
    }

    // Search input
    const searchInput = document.getElementById("search-input")
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        const term = searchInput.value
        this.handleSearch(term)
      })
    }

    // History search input
    const historySearchInput = document.getElementById("history-search-input")
    if (historySearchInput) {
      historySearchInput.addEventListener("input", () => {
        const term = historySearchInput.value
        this.handleHistorySearch(term)
      })
    }

    // Modal close button
    const modalClose = document.getElementById("modal-close")
    if (modalClose) {
      modalClose.addEventListener("click", () => {
        this.closeModal()
      })
    }

    // Modal cancel button
    const modalCancel = document.getElementById("modal-cancel")
    if (modalCancel) {
      modalCancel.addEventListener("click", () => {
        this.closeModal()
      })
    }

    // Modal confirm button
    const modalConfirm = document.getElementById("modal-confirm")
    if (modalConfirm) {
      modalConfirm.addEventListener("click", () => {
        if (this.bookToDelete) {
          this.confirmDeleteBook()
        } else if (this.bookToReturn) {
          this.confirmReturnBook()
        }
      })
    }
  }

  switchTab(tab) {
    this.activeTab = tab

    // Update nav buttons
    document.querySelectorAll(".nav-button").forEach((button) => {
      if (button.getAttribute("data-tab") === tab) {
        button.classList.add("active")
      } else {
        button.classList.remove("active")
      }
    })

    // Update tab buttons
    document.querySelectorAll(".tab-button").forEach((button) => {
      if (button.getAttribute("data-tab") === tab) {
        button.classList.add("active")
      } else {
        button.classList.remove("active")
      }
    })

    // Update tab panes
    document.querySelectorAll(".tab-pane").forEach((pane) => {
      if (pane.id === tab) {
        pane.classList.add("active")
      } else {
        pane.classList.remove("active")
      }
    })

    // Update content based on active tab
    this.updateTabContent(tab)
  }

  switchIssueReturnTab(tab) {
    this.issueReturnTab = tab

    // Update tab buttons
    document.querySelectorAll(".issue-return-tab").forEach((button) => {
      if (button.getAttribute("data-tab") === tab) {
        button.classList.add("active")
      } else {
        button.classList.remove("active")
      }
    })

    // Update tab panes
    document.querySelectorAll(".issue-return-pane").forEach((pane) => {
      if (pane.id === `${tab}-pane`) {
        pane.classList.add("active")
      } else {
        pane.classList.remove("active")
      }
    })
  }

  updateTabContent(tab) {
    switch (tab) {
      case "dashboard":
        this.renderDashboard()
        break
      case "books":
        this.renderBooksList()
        break
      case "add-book":
        // Form is static, no need to update
        break
      case "search":
        // Search is handled by input event
        break
      case "issue-return":
        this.renderIssueReturnBooks()
        break
      case "history":
        this.renderHistory()
        break
    }
  }

  updateAllTabs() {
    this.renderDashboard()
    this.renderBooksList()
    this.renderIssueReturnBooks()
    this.renderHistory()
  }

  renderDashboard() {
    const stats = this.library.getStats()

    // Update stats
    const totalBooksElement = document.getElementById("total-books-count")
    const availableBooksElement = document.getElementById("available-books-count")
    const issuedBooksElement = document.getElementById("issued-books-count")
    const categoriesElement = document.getElementById("categories-count")

    if (totalBooksElement) totalBooksElement.textContent = stats.totalBooks.toString()
    if (availableBooksElement) availableBooksElement.textContent = stats.availableBooks.toString()
    if (issuedBooksElement) issuedBooksElement.textContent = stats.issuedBooks.toString()
    if (categoriesElement) categoriesElement.textContent = stats.categories.toString()

    // Update recent activity
    const recentActivityList = document.getElementById("recent-activity-list")
    if (recentActivityList) {
      const books = this.library.getBooks()
      const recentBooks = books.slice(-3).reverse()

      recentActivityList.innerHTML = ""

      if (recentBooks.length === 0) {
        recentActivityList.innerHTML = '<div class="search-placeholder">No books added yet</div>'
      } else {
        recentBooks.forEach((book) => {
          const activityItem = document.createElement("div")
          activityItem.className = "activity-item"

          activityItem.innerHTML = `
          <div class="activity-icon">
            <i class="fas fa-book-open"></i>
          </div>
          <div class="activity-content">
            <div class="activity-title">${book.title}</div>
            <div class="activity-subtitle">${book.author} • ${book.category}</div>
          </div>
          <div class="activity-status ${book.status === "Available" ? "status-available" : "status-issued"}">
            ${book.status}
          </div>
        `

          recentActivityList.appendChild(activityItem)
        })
      }
    }
  }

  renderBooksList() {
    const books = this.library.getBooks()
    const booksTableBody = document.getElementById("books-table-body")
    const booksCount = document.getElementById("books-count")

    if (booksCount) {
      booksCount.textContent = books.length.toString()
    }

    if (booksTableBody) {
      booksTableBody.innerHTML = ""

      if (books.length === 0) {
        const emptyRow = document.createElement("tr")
        emptyRow.innerHTML = `
        <td colspan="7" class="text-center">No books found</td>
      `
        booksTableBody.appendChild(emptyRow)
      } else {
        books.forEach((book) => {
          const row = document.createElement("tr")

          row.innerHTML = `
          <td>${book.title}</td>
          <td>${book.author}</td>
          <td>${book.isbn}</td>
          <td>${book.category}</td>
          <td>
            <span class="status-badge ${book.status === "Available" ? "badge-available" : "badge-issued"}">
              ${book.status}
            </span>
          </td>
          <td>${new Date(book.addedDate).toLocaleDateString()}</td>
          <td>
            <button class="btn btn-sm btn-danger delete-book" data-id="${book.id}">
              <i class="fas fa-trash"></i>
            </button>
          </td>
        `

          booksTableBody.appendChild(row)
        })

        // Add event listeners to delete buttons
        document.querySelectorAll(".delete-book").forEach((button) => {
          button.addEventListener("click", (e) => {
            const target = e.currentTarget
            const bookId = target.getAttribute("data-id")
            if (bookId) {
              this.showDeleteConfirmation(bookId)
            }
          })
        })
      }
    }
  }

  renderIssueReturnBooks() {
    // Populate issue book select
    const issueBookSelect = document.getElementById("issue-book-select")
    const availableBooks = this.library.getAvailableBooks()

    if (issueBookSelect) {
      // Clear previous options except the first one
      while (issueBookSelect.options.length > 1) {
        issueBookSelect.remove(1)
      }

      // Add available books
      availableBooks.forEach((book) => {
        const option = document.createElement("option")
        option.value = book.id
        option.textContent = `${book.title} - ${book.author}`
        issueBookSelect.appendChild(option)
      })
    }

    // Set minimum date for due date input
    const dueDateInput = document.getElementById("due-date")
    if (dueDateInput) {
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      dueDateInput.min = tomorrow.toISOString().split("T")[0]
    }

    // Populate return book table
    const returnTableBody = document.getElementById("return-table-body")
    const returnTableContainer = document.getElementById("return-table-container")
    const issuedBooks = this.library.getIssuedBooks()

    if (returnTableBody && returnTableContainer) {
      returnTableBody.innerHTML = ""

      if (issuedBooks.length === 0) {
        returnTableContainer.innerHTML = `
        <div class="search-placeholder">
          <p>No books to return</p>
          <p class="search-empty-subtitle">All books are currently available</p>
        </div>
      `
      } else {
        // Restore table if it was replaced
        if (!returnTableContainer.querySelector("table")) {
          returnTableContainer.innerHTML = `
          <table class="data-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Borrower</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody id="return-table-body">
            </tbody>
          </table>
        `
        }

        const returnTableBody = document.getElementById("return-table-body")
        if (returnTableBody) {
          issuedBooks.forEach((book) => {
            const row = document.createElement("tr")

            row.innerHTML = `
            <td>${book.title}</td>
            <td>${book.borrower}</td>
            <td>${new Date(book.dueDate).toLocaleDateString()}</td>
            <td>
              <button class="btn btn-sm btn-success return-book" data-id="${book.id}">
                Return
              </button>
            </td>
          `

            returnTableBody.appendChild(row)
          })

          // Add event listeners to return buttons
          document.querySelectorAll(".return-book").forEach((button) => {
            button.addEventListener("click", (e) => {
              const target = e.currentTarget
              const bookId = target.getAttribute("data-id")
              if (bookId) {
                this.showReturnConfirmation(bookId)
              }
            })
          })
        }
      }
    }
  }

  renderHistory() {
    const history = this.library.getHistory()
    this.renderHistoryTable(history)
  }

  renderHistoryTable(history) {
    const historyTableBody = document.getElementById("history-table-body")

    if (historyTableBody) {
      historyTableBody.innerHTML = ""

      if (history.length === 0) {
        const emptyRow = document.createElement("tr")
        emptyRow.innerHTML = `
        <td colspan="4" class="text-center">No history records found</td>
      `
        historyTableBody.appendChild(emptyRow)
      } else {
        // Sort history by date (newest first)
        const sortedHistory = [...history].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

        sortedHistory.forEach((record) => {
          const row = document.createElement("tr")

          row.innerHTML = `
          <td>${new Date(record.date).toLocaleDateString()} ${new Date(record.date).toLocaleTimeString()}</td>
          <td>${record.bookTitle}</td>
          <td>
            <span class="status-badge ${record.action === "Issue" ? "badge-issue" : "badge-return"}">
              ${record.action}
            </span>
          </td>
          <td>${record.borrower}</td>
        `

          historyTableBody.appendChild(row)
        })
      }
    }
  }

  handleSearch(term) {
    const searchResults = document.getElementById("search-results")

    if (searchResults) {
      if (!term.trim()) {
        searchResults.innerHTML = `
        <div class="search-placeholder">
          <p>Type in the search box to find books</p>
        </div>
      `
        return
      }

      // Show loading spinner
      searchResults.innerHTML = `
      <div class="search-loading">
        <div class="search-spinner"></div>
      </div>
    `

      // Simulate search delay
      setTimeout(() => {
        const results = this.library.searchBooks(term)

        if (results.length === 0) {
          searchResults.innerHTML = `
          <div class="search-empty">
            <p class="search-empty-title">No books found</p>
            <p class="search-empty-subtitle">Try a different search term</p>
          </div>
        `
        } else {
          searchResults.innerHTML = `
          <div class="table-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Author</th>
                  <th>ISBN</th>
                  <th>Category</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody id="search-results-body">
              </tbody>
            </table>
          </div>
        `

          const searchResultsBody = document.getElementById("search-results-body")
          if (searchResultsBody) {
            results.forEach((book) => {
              const row = document.createElement("tr")

              row.innerHTML = `
              <td>${book.title}</td>
              <td>${book.author}</td>
              <td>${book.isbn}</td>
              <td>${book.category}</td>
              <td>
                <span class="status-badge ${book.status === "Available" ? "badge-available" : "badge-issued"}">
                  ${book.status}
                </span>
              </td>
            `

              searchResultsBody.appendChild(row)
            })
          }
        }
      }, 300)
    }
  }

  handleHistorySearch(term) {
    const results = this.library.searchHistory(term)
    this.renderHistoryTable(results)
  }

  handleAddBook() {
    if (this.isSubmitting) return

    const titleInput = document.getElementById("book-title")
    const authorInput = document.getElementById("book-author")
    const isbnInput = document.getElementById("book-isbn")
    const categorySelect = document.getElementById("book-category")

    const titleError = document.getElementById("title-error")
    const authorError = document.getElementById("author-error")
    const isbnError = document.getElementById("isbn-error")
    const categoryError = document.getElementById("category-error")

    // Reset errors
    if (titleError) titleError.textContent = ""
    if (authorError) authorError.textContent = ""
    if (isbnError) isbnError.textContent = ""
    if (categoryError) categoryError.textContent = ""

    // Validate inputs
    let isValid = true

    if (!titleInput.value.trim() || titleInput.value.length < 2) {
      if (titleError) titleError.textContent = "Title must be at least 2 characters."
      isValid = false
    }

    if (!authorInput.value.trim() || authorInput.value.length < 2) {
      if (authorError) authorError.textContent = "Author must be at least 2 characters."
      isValid = false
    }

    if (!isbnInput.value.trim() || isbnInput.value.length < 10) {
      if (isbnError) isbnError.textContent = "ISBN must be at least 10 characters."
      isValid = false
    }

    if (!categorySelect.value) {
      if (categoryError) categoryError.textContent = "Please select a category."
      isValid = false
    }

    if (!isValid) return

    // Add book
    this.isSubmitting = true
    const addBookBtn = document.getElementById("add-book-btn")
    if (addBookBtn) {
      addBookBtn.textContent = "Adding..."
      addBookBtn.setAttribute("disabled", "true")
    }

    // Simulate network delay
    setTimeout(() => {
      const newBook = this.library.addBook({
        title: titleInput.value,
        author: authorInput.value,
        isbn: isbnInput.value,
        category: categorySelect.value,
      })

      // Reset form
      titleInput.value = ""
      authorInput.value = ""
      isbnInput.value = ""
      categorySelect.value = ""

      // Show toast
      this.showToast("Book Added", `"${newBook.title}" has been added to the library.`, "success")

      // Update UI
      this.updateAllTabs()

      // Reset button
      if (addBookBtn) {
        addBookBtn.textContent = "Add Book"
        addBookBtn.removeAttribute("disabled")
      }

      this.isSubmitting = false
    }, 500)
  }

  handleIssueBook() {
    if (this.isSubmitting) return

    const bookSelect = document.getElementById("issue-book-select")
    const borrowerInput = document.getElementById("borrower-name")
    const dueDateInput = document.getElementById("due-date")

    const bookError = document.getElementById("issue-book-error")
    const borrowerError = document.getElementById("borrower-error")
    const dueDateError = document.getElementById("due-date-error")

    // Reset errors
    if (bookError) bookError.textContent = ""
    if (borrowerError) borrowerError.textContent = ""
    if (dueDateError) dueDateError.textContent = ""

    // Validate inputs
    let isValid = true

    if (!bookSelect.value) {
      if (bookError) bookError.textContent = "Please select a book."
      isValid = false
    }

    if (!borrowerInput.value.trim() || borrowerInput.value.length < 2) {
      if (borrowerError) borrowerError.textContent = "Borrower name must be at least 2 characters."
      isValid = false
    }

    if (!dueDateInput.value) {
      if (dueDateError) dueDateError.textContent = "Please select a due date."
      isValid = false
    }

    if (!isValid) return

    // Issue book
    this.isSubmitting = true
    const issueBtn = document.getElementById("issue-btn")
    if (issueBtn) {
      issueBtn.textContent = "Issuing..."
      issueBtn.setAttribute("disabled", "true")
    }

    // Simulate network delay
    setTimeout(() => {
      const book = this.library.getBookById(bookSelect.value)
      const success = this.library.issueBook(bookSelect.value, borrowerInput.value, dueDateInput.value)

      if (success && book) {
        // Reset form
        bookSelect.value = ""
        borrowerInput.value = ""
        dueDateInput.value = ""

        // Show toast
        this.showToast("Book Issued", `Book has been issued to ${borrowerInput.value}.`, "success")

        // Update UI
        this.updateAllTabs()
      } else {
        this.showToast("Error", "Failed to issue book. It may no longer be available.", "error")
      }

      // Reset button
      if (issueBtn) {
        issueBtn.textContent = "Issue Book"
        issueBtn.removeAttribute("disabled")
      }

      this.isSubmitting = false
    }, 500)
  }

  showDeleteConfirmation(bookId) {
    const book = this.library.getBookById(bookId)
    if (!book) return

    this.bookToDelete = bookId

    const modalTitle = document.getElementById("modal-title")
    const modalMessage = document.getElementById("modal-message")
    const modalConfirm = document.getElementById("modal-confirm")

    if (modalTitle) modalTitle.textContent = "Are you sure?"
    if (modalMessage)
      modalMessage.textContent = `This will permanently delete the book "${book.title}" from the library. This action cannot be undone.`
    if (modalConfirm) {
      modalConfirm.textContent = "Delete"
      modalConfirm.className = "btn btn-danger"
    }

    this.openModal()
  }

  showReturnConfirmation(bookId) {
    const book = this.library.getBookById(bookId)
    if (!book) return

    this.bookToReturn = bookId

    const modalTitle = document.getElementById("modal-title")
    const modalMessage = document.getElementById("modal-message")
    const modalConfirm = document.getElementById("modal-confirm")

    if (modalTitle) modalTitle.textContent = "Confirm Return"
    if (modalMessage) modalMessage.textContent = `Are you sure you want to mark "${book.title}" as returned?`
    if (modalConfirm) {
      modalConfirm.textContent = "Confirm"
      modalConfirm.className = "btn btn-success"
    }

    this.openModal()
  }

  confirmDeleteBook() {
    if (!this.bookToDelete) return

    const book = this.library.getBookById(this.bookToDelete)
    const success = this.library.deleteBook(this.bookToDelete)

    if (success && book) {
      this.showToast("Book Deleted", `"${book.title}" has been removed from the library.`, "success")
      this.updateAllTabs()
    } else {
      this.showToast("Error", "Failed to delete book.", "error")
    }

    this.closeModal()
    this.bookToDelete = null
  }

  confirmReturnBook() {
    if (!this.bookToReturn) return

    const book = this.library.getBookById(this.bookToReturn)
    const success = this.library.returnBook(this.bookToReturn)

    if (success && book) {
      this.showToast("Book Returned", `"${book.title}" has been returned to the library.`, "success")
      this.updateAllTabs()
    } else {
      this.showToast("Error", "Failed to return book.", "error")
    }

    this.closeModal()
    this.bookToReturn = null
  }

  openModal() {
    const modal = document.getElementById("confirm-modal")
    if (modal) {
      modal.classList.add("active")
    }
  }

  closeModal() {
    const modal = document.getElementById("confirm-modal")
    if (modal) {
      modal.classList.remove("active")
    }
  }

  showToast(title, message, type = "success") {
    const toastContainer = document.getElementById("toast-container")
    if (!toastContainer) return

    const toast = document.createElement("div")
    toast.className = `toast toast-${type}`

    toast.innerHTML = `
    <div class="toast-header">
      <div class="toast-title">${title}</div>
      <button class="toast-close">&times;</button>
    </div>
    <div class="toast-body">${message}</div>
  `

    toastContainer.appendChild(toast)

    // Add event listener to close button
    const closeButton = toast.querySelector(".toast-close")
    if (closeButton) {
      closeButton.addEventListener("click", () => {
        toast.style.animation = "slideOut 0.3s ease-in-out forwards"
        setTimeout(() => {
          toast.remove()
        }, 300)
      })
    }

    // Auto-remove toast after 5 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.style.animation = "slideOut 0.3s ease-in-out forwards"
        setTimeout(() => {
          toast.remove()
        }, 300)
      }
    }, 5000)
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", () => {
  const library = new LibraryManager()
  const ui = new UIManager(library)
})
