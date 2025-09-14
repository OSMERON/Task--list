window.addEventListener("load", () => {
  const form = document.querySelector("#new-task-form")
  const input = document.querySelector("#new-task-input")
  const categorySelect = document.querySelector("#task-category")
  const listEl = document.querySelector("#tasks")
  const quickPick = document.querySelector("#quick-pick")
  const filters = document.querySelector("#filters")

  const newCatInput = document.querySelector("#new-category-input")
  const newCatColor = document.querySelector("#new-category-color")
  const addCatBtn = document.querySelector("#add-category-btn")
  const categoryList = document.querySelector("#category-list")

  const modeToggle = document.querySelector("#mode-toggle")
  const modeLabel = document.querySelector("#mode-label")

  const calendarTitle = document.querySelector("#calendar-title")
  const calendarGrid = document.querySelector("#calendar-grid")
  const calendarLegend = document.querySelector("#calendar-legend")
  const prevMonthBtn = document.querySelector("#prev-month")
  const nextMonthBtn = document.querySelector("#next-month")

  const saved = JSON.parse(localStorage.getItem("tasks")) || []
  const savedCategories = JSON.parse(localStorage.getItem("categories")) || [
    { name: "Work", color: "#3b82f6" },
    { name: "Personal", color: "#8b5cf6" },
    { name: "Urgent", color: "#ef4444" },
    { name: "Other", color: "#10b981" }
  ]
  const completions = JSON.parse(localStorage.getItem("completions")) || {}

  const savedTheme = localStorage.getItem("theme") || "dark"
  applyTheme(savedTheme)

  modeToggle.addEventListener("change", () => {
    const next = document.body.classList.contains("light") ? "dark" : "light"
    applyTheme(next)
  })

  let currentMonth = new Date().getMonth()
  let currentYear = new Date().getFullYear()

  init()

  function applyTheme(theme) {
    if (theme === "light") {
      document.body.classList.add("light")
      modeToggle.checked = true
      modeLabel.textContent = "Dark theme"
      modeToggle.setAttribute("aria-label", "Switch to dark theme")
    } else {
      document.body.classList.remove("light")
      modeToggle.checked = false
      modeLabel.textContent = "Light theme"
      modeToggle.setAttribute("aria-label", "Switch to light theme")
    }
    localStorage.setItem("theme", theme)
  }

  function init() {
    buildCategorySelect()
    buildQuickPick()
    buildFilterButtons()
    buildCategoryManager()
    buildLegend()
    renderCalendar(currentYear, currentMonth)

    saved.forEach(t => createTask(t.text, t.category, t.completed))

    form.addEventListener("submit", onAddTask)
    addCatBtn.addEventListener("click", onAddCategory)
    prevMonthBtn.addEventListener("click", () => changeMonth(-1))
    nextMonthBtn.addEventListener("click", () => changeMonth(1))
  }

  function onAddTask(e) {
    e.preventDefault()
    const text = input.value.trim()
    const category = categorySelect.value
    if (!text) return
    const task = { text, category, completed: false }
    saved.push(task)
    localStorage.setItem("tasks", JSON.stringify(saved))
    createTask(text, category, false)
    input.value = ""
  }

  function onAddCategory() {
    const name = newCatInput.value.trim()
    const color = newCatColor.value
    if (!name) return
    if (savedCategories.find(c => c.name.toLowerCase() === name.toLowerCase())) return
    savedCategories.push({ name, color })
    localStorage.setItem("categories", JSON.stringify(savedCategories))
    rebuildAfterCategoryChange()
    newCatInput.value = ""
  }

  function rebuildAfterCategoryChange() {
    buildCategorySelect()
    buildQuickPick()
    buildFilterButtons()
    buildCategoryManager()
    buildLegend()
    rebuildTaskColors()
    renderCalendar(currentYear, currentMonth)
  }

  function buildCategorySelect() {
    categorySelect.innerHTML = ""
    savedCategories.forEach(cat => {
      const option = document.createElement("option")
      option.value = cat.name
      option.textContent = cat.name
      categorySelect.appendChild(option)
    })
  }

  function buildQuickPick() {
    quickPick.innerHTML = ""
    savedCategories.forEach(cat => {
      const chip = document.createElement("button")
      chip.type = "button"
      chip.className = "quick-chip"
      chip.textContent = cat.name
      chip.style.borderLeft = `6px solid ${cat.color}`
      chip.addEventListener("click", () => {
        categorySelect.value = cat.name
        document.querySelectorAll(".quick-chip").forEach(c => c.classList.remove("active"))
        chip.classList.add("active")
        input.focus()
      })
      quickPick.appendChild(chip)
    })
  }

  function buildFilterButtons() {
    filters.innerHTML = ""
    const allBtn = document.createElement("button")
    allBtn.type = "button"
    allBtn.textContent = "All"
    allBtn.classList.add("active")
    allBtn.addEventListener("click", () => filterTasks("All"))
    filters.appendChild(allBtn)

    savedCategories.forEach(cat => {
      const btn = document.createElement("button")
      btn.type = "button"
      btn.textContent = cat.name
      btn.style.borderLeft = `6px solid ${cat.color}`
      btn.addEventListener("click", () => filterTasks(cat.name))
      filters.appendChild(btn)
    })
  }

  function filterTasks(category) {
    document.querySelectorAll("#filters button").forEach(b => b.classList.remove("active"))
    const toActivate = [...filters.children].find(b => b.textContent === category || (category === "All" && b.textContent === "All"))
    if (toActivate) toActivate.classList.add("active")
    document.querySelectorAll(".task").forEach(task => {
      const match = category === "All" || task.dataset.category === category
      task.style.display = match ? "flex" : "none"
    })
  }

  function buildCategoryManager() {
    categoryList.innerHTML = ""
    savedCategories.forEach((cat, index) => {
      const item = document.createElement("div")
      item.classList.add("category-item")

      const colorInput = document.createElement("input")
      colorInput.type = "color"
      colorInput.value = cat.color

      const nameInput = document.createElement("input")
      nameInput.type = "text"
      nameInput.value = cat.name

      const saveBtn = document.createElement("button")
      saveBtn.textContent = "Save"

      const deleteBtn = document.createElement("button")
      deleteBtn.textContent = "Delete"
      deleteBtn.classList.add("delete")

      item.append(colorInput, nameInput, saveBtn, deleteBtn)
      categoryList.appendChild(item)

      saveBtn.addEventListener("click", () => {
        const oldName = cat.name
        const newName = nameInput.value.trim()
        const newColor = colorInput.value
        if (!newName) return
        cat.name = newName
        cat.color = newColor
        localStorage.setItem("categories", JSON.stringify(savedCategories))
        saved.forEach(t => { if (t.category === oldName) t.category = newName })
        localStorage.setItem("tasks", JSON.stringify(saved))
        Object.keys(completions).forEach(k => {
          if (completions[k][oldName] && newName !== oldName) {
            completions[k][newName] = (completions[k][newName] || 0) + completions[k][oldName]
            delete completions[k][oldName]
          }
        })
        localStorage.setItem("completions", JSON.stringify(completions))
        rebuildAfterCategoryChange()
      })

      deleteBtn.addEventListener("click", () => {
        if (!confirm("Delete this category? Tasks keep their old name")) return
        savedCategories.splice(index, 1)
        localStorage.setItem("categories", JSON.stringify(savedCategories))
        rebuildAfterCategoryChange()
      })
    })
  }

  function rebuildTaskColors() {
    document.querySelectorAll(".task").forEach(task => {
      const catName = task.dataset.category
      const color = getCategoryColor(catName)
      task.style.borderLeft = `6px solid ${color}`
    })
  }

  function getCategoryColor(name) {
    const hit = savedCategories.find(c => c.name === name)
    return hit ? hit.color : "#6b7280"
  }

  function createTask(text, category, completed) {
    const color = getCategoryColor(category)
    const taskEl = document.createElement("div")
    taskEl.classList.add("task")
    taskEl.dataset.category = category
    taskEl.style.borderLeft = `6px solid ${color}`

    const contentEl = document.createElement("div")
    contentEl.classList.add("content")
    const inputEl = document.createElement("input")
    inputEl.classList.add("text")
    inputEl.type = "text"
    inputEl.value = text
    inputEl.setAttribute("readonly", "readonly")
    contentEl.appendChild(inputEl)

    const actionsEl = document.createElement("div")
    actionsEl.classList.add("actions")
    const editBtn = document.createElement("button")
    editBtn.classList.add("edit")
    editBtn.textContent = "Edit"
    const completeBtn = document.createElement("button")
    completeBtn.classList.add("complete")
    completeBtn.textContent = "Complete"
    const deleteBtn = document.createElement("button")
    deleteBtn.classList.add("delete")
    deleteBtn.textContent = "Delete"

    actionsEl.append(editBtn, completeBtn, deleteBtn)
    taskEl.append(contentEl, actionsEl)
    listEl.appendChild(taskEl)

    if (completed) {
      taskEl.classList.add("completed")
      completeBtn.textContent = "Undo"
    }

    editBtn.addEventListener("click", () => {
      if (editBtn.textContent.toLowerCase() === "edit") {
        inputEl.removeAttribute("readonly")
        inputEl.focus()
        editBtn.textContent = "Save"
      } else {
        inputEl.setAttribute("readonly", "readonly")
        editBtn.textContent = "Edit"
        const idx = saved.findIndex(t => t.text === text && t.category === category)
        if (idx > -1) {
          saved[idx].text = inputEl.value
          localStorage.setItem("tasks", JSON.stringify(saved))
        }
      }
    })

    completeBtn.addEventListener("click", () => {
      const idx = saved.findIndex(t => t.text === text && t.category === category)
      if (idx === -1) return
      saved[idx].completed = !saved[idx].completed
      localStorage.setItem("tasks", JSON.stringify(saved))
      if (saved[idx].completed) {
        taskEl.classList.add("completed")
        completeBtn.textContent = "Undo"
        recordCompletion(saved[idx].category, new Date())
      } else {
        taskEl.classList.remove("completed")
        completeBtn.textContent = "Complete"
        removeCompletion(saved[idx].category, new Date())
      }
      renderCalendar(currentYear, currentMonth)
    })

    deleteBtn.addEventListener("click", () => {
      listEl.removeChild(taskEl)
      const idx = saved.findIndex(t => t.text === text && t.category === category)
      if (idx > -1) {
        const wasCompleted = saved[idx].completed
        const catName = saved[idx].category
        saved.splice(idx, 1)
        localStorage.setItem("tasks", JSON.stringify(saved))
        if (wasCompleted) {
          removeCompletion(catName, new Date())
          renderCalendar(currentYear, currentMonth)
        }
      }
    })
  }

  function recordCompletion(category, date) {
    const key = toDateKey(date)
    if (!completions[key]) completions[key] = {}
    completions[key][category] = (completions[key][category] || 0) + 1
    localStorage.setItem("completions", JSON.stringify(completions))
  }

  function removeCompletion(category, date) {
    const key = toDateKey(date)
    if (!completions[key]) return
    if (completions[key][category]) {
      completions[key][category] = Math.max(0, completions[key][category] - 1)
      if (completions[key][category] === 0) delete completions[key][category]
      if (Object.keys(completions[key]).length === 0) delete completions[key]
      localStorage.setItem("completions", JSON.stringify(completions))
    }
  }

  function toDateKey(date) {
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  function changeMonth(delta) {
    currentMonth += delta
    if (currentMonth < 0) { currentMonth = 11; currentYear -= 1 }
    else if (currentMonth > 11) { currentMonth = 0; currentYear += 1 }
    renderCalendar(currentYear, currentMonth)
  }

  function buildLegend() {
    calendarLegend.innerHTML = ""
    savedCategories.forEach(cat => {
      const item = document.createElement("div")
      item.classList.add("legend-item")
      const swatch = document.createElement("div")
      swatch.classList.add("legend-swatch")
      swatch.style.background = cat.color
      const label = document.createElement("span")
      label.textContent = cat.name
      item.append(swatch, label)
      calendarLegend.appendChild(item)
    })
  }

  function renderCalendar(year, month) {
    calendarGrid.innerHTML = ""

    const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"]
    calendarTitle.textContent = `${monthNames[month]} ${year}`

    const dayNames = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"]
    dayNames.forEach(d => {
      const dn = document.createElement("div")
      dn.classList.add("calendar-dayname")
      dn.textContent = d
      calendarGrid.appendChild(dn)
    })

    const firstOfMonth = new Date(year, month, 1)
    const startOffset = ((firstOfMonth.getDay() + 6) % 7)
    const daysInMonth = new Date(year, month + 1, 0).getDate()

    for (let i = 0; i < startOffset; i++) {
      const empty = document.createElement("div")
      calendarGrid.appendChild(empty)
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cell = document.createElement("div")
      cell.classList.add("calendar-cell")

      const dateSpan = document.createElement("div")
      dateSpan.classList.add("date")
      dateSpan.textContent = String(day)

      const dots = document.createElement("div")
      dots.classList.add("dots")

      const key = `${year}-${String(month + 1).padStart(2,"0")}-${String(day).padStart(2,"0")}`
      const comps = completions[key] || {}
      Object.keys(comps).forEach(catName => {
        const dot = document.createElement("div")
        dot.classList.add("calendar-dot")
        dot.title = `${catName}: ${comps[catName]} completed`
        dot.style.background = getCategoryColor(catName)
        dots.appendChild(dot)
      })

      cell.append(dateSpan, dots)
      calendarGrid.appendChild(cell)
    }
  }
})
