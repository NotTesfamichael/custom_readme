document.addEventListener("DOMContentLoaded", () => {
  // --- DOM Elements ---
  const sectionContainer = document.getElementById("section-container");
  const projectNameInput = document.getElementById("projectName");
  const projectDescriptionTextarea = document.getElementById("projectDescription");

  const markdownEditor = document.getElementById("markdownEditor");
  const readmePreview = document.getElementById("readmePreview");
  const copyMarkdownButton = document.getElementById("copyMarkdown");
  const addSectionBtn = document.getElementById("add-section-btn");
  const sectionTypeSelect = document.getElementById("section-type-select");

  // --- State Variables ---
  let draggedItem = null;
  let manualEditMode = false;

  // --- Helper to attach event listeners to a section ---
  function attachSectionListeners(sectionElement) {
    // Content textarea input
    sectionElement.querySelector(".section-content-textarea")?.addEventListener("input", () => {
      manualEditMode = false;
      renderReadme();
    });

    // Custom title input for generic sections
    sectionElement.querySelector(".section-title-input")?.addEventListener("input", () => {
      manualEditMode = false;
      renderReadme();
    });

    // Remove button
    sectionElement.querySelector(".remove-section-btn")?.addEventListener("click", () => {
      sectionElement.remove();
      manualEditMode = false;
      renderReadme();
    });
  }

  // --- Generate markdown content per section ---
  function getSectionContent(sectionElement) {
    const sectionType = sectionElement.dataset.sectionId;
    const textarea = sectionElement.querySelector(".section-content-textarea");
    const content = textarea ? textarea.value.trim() : "";

    const titleInput = sectionElement.querySelector(".section-title-input");
    const customTitle = titleInput ? titleInput.value.trim() : "";

    switch (sectionType) {
      case "project-info":
        const projectName = projectNameInput.value.trim();
        const projectDescription = projectDescriptionTextarea.value.trim();
        return `# ${projectName || "Your Project Title"}\n\n${projectDescription || "A brief description of your project."}\n\n`;

      case "installation":
        return content ? `## Installation\n\n${wrapCodeBlock(content)}\n\n` : "";

      case "usage":
        return content ? `## Usage\n\n${content}\n\n` : "";

      case "features":
        let featuresMarkdown = "";
        if (content) {
          featuresMarkdown += "## Features\n\n";
          content.split("\n").forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              if (!trimmedLine.startsWith("- ") && !trimmedLine.startsWith("* ")) {
                featuresMarkdown += `- ${trimmedLine}\n`;
              } else {
                featuresMarkdown += `${trimmedLine}\n`;
              }
            }
          });
          featuresMarkdown += "\n";
        }
        return featuresMarkdown;

      case "contributing":
        return content ? `## Contributing\n\n${content}\n\n` : "";

      case "license":
        return content
          ? `## License\n\nThis project is licensed under the ${content} - see the [LICENSE.md](LICENSE.md) file for details.\n\n`
          : "";

      case "links":
        return content ? `## Links/Resources\n\n${content}\n\n` : "";

      case "acknowledgments":
        return content ? `## Acknowledgments\n\n${content}\n\n` : "";

      case "generic":
        return content ? `## ${customTitle || "New Section"}\n\n${content}\n\n` : "";

      default:
        return "";
    }
  }

  // Helper to wrap Installation content in fenced code block automatically
  function wrapCodeBlock(text) {
    // Check if text already looks like a code block (starts and ends with ```), if not, wrap it
    if (/^```[\s\S]*```$/.test(text.trim())) {
      return text;
    }
    return "```\n" + text + "\n```";
  }

  // --- Generate full markdown from all sections ---
  function generateMarkdownFromSections() {
    let fullMarkdown = "";
    const sections = sectionContainer.querySelectorAll(".form-section");

    sections.forEach((section) => {
      fullMarkdown += getSectionContent(section);
    });

    return fullMarkdown;
  }

  // --- Render markdown preview and sync editor ---
  function renderReadme() {
    let currentMarkdown = "";

    if (manualEditMode) {
      currentMarkdown = markdownEditor.value;
    } else {
      currentMarkdown = generateMarkdownFromSections();
      markdownEditor.value = currentMarkdown;
    }

    readmePreview.innerHTML = marked.parse(currentMarkdown);
    readmePreview.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  }

  // --- Create draggable/removable section ---
  function createDraggableSection(type, title = "", content = "") {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("form-section", "draggable-section");
    sectionDiv.dataset.sectionId = type;
    sectionDiv.setAttribute("draggable", "true");

    let innerHTML = "";
    let placeholderText = `Content for ${type.charAt(0).toUpperCase() + type.slice(1)} section...`;

    if (type === "generic") {
      innerHTML = `
        <h3 class="section-handle"><input type="text" class="section-title-input" value="${title || "New Section Title"}"> <span class="drag-icon">⠿</span></h3>
        <div class="form-group">
          <textarea class="section-content-textarea" rows="4" placeholder="Content for this custom section...">${content}</textarea>
        </div>
      `;
    } else if (type === "links") {
      innerHTML = `
        <h3 class="section-handle">Links/Resources <span class="drag-icon">⠿</span></h3>
        <div class="form-group">
          <textarea class="section-content-textarea" rows="4" placeholder="Add links here, e.g., [Docs](https://example.com/docs)&#10;[Demo](https://example.com/demo)">${content}</textarea>
        </div>
      `;
    } else {
      innerHTML = `
        <h3 class="section-handle">${type.charAt(0).toUpperCase() + type.slice(1)} <span class="drag-icon">⠿</span></h3>
        <div class="form-group">
          <textarea class="section-content-textarea" rows="3" placeholder="${placeholderText}">${content}</textarea>
        </div>
      `;
    }

    innerHTML += `<button class="remove-section-btn">Remove</button>`;
    sectionDiv.innerHTML = innerHTML;

    attachSectionListeners(sectionDiv);

    return sectionDiv;
  }

  // --- Add section button listener ---
  addSectionBtn.addEventListener("click", () => {
    const selectedType = sectionTypeSelect.value;
    const newSection = createDraggableSection(selectedType);
    sectionContainer.appendChild(newSection);
    manualEditMode = false;
    renderReadme();
  });

  // --- Drag & Drop logic ---
  sectionContainer.addEventListener("dragstart", (e) => {
    const targetSection = e.target.closest(".draggable-section");
    if (targetSection) {
      draggedItem = targetSection;
      e.dataTransfer.effectAllowed = "move";
      e.dataTransfer.setData("text/plain", targetSection.dataset.instanceId || targetSection.dataset.sectionId);
      setTimeout(() => targetSection.classList.add("dragging"), 0);
    }
  });

  sectionContainer.addEventListener("dragover", (e) => {
    e.preventDefault();
    const targetSection = e.target.closest(".draggable-section");
    if (targetSection && draggedItem !== targetSection && !targetSection.classList.contains("static-section")) {
      const boundingBox = targetSection.getBoundingClientRect();
      const offset = e.clientY - boundingBox.top;

      sectionContainer.querySelectorAll(".draggable-section").forEach((section) => {
        section.classList.remove("drag-over-top", "drag-over-bottom");
      });

      if (offset < boundingBox.height / 2) {
        targetSection.classList.add("drag-over-top");
      } else {
        targetSection.classList.add("drag-over-bottom");
      }
    }
  });

  sectionContainer.addEventListener("dragleave", (e) => {
    const targetSection = e.target.closest(".draggable-section");
    if (targetSection) {
      targetSection.classList.remove("drag-over-top", "drag-over-bottom");
    }
  });

  sectionContainer.addEventListener("drop", (e) => {
    e.preventDefault();
    const targetSection = e.target.closest(".draggable-section");

    if (targetSection && draggedItem && draggedItem !== targetSection && !targetSection.classList.contains("static-section")) {
      const boundingBox = targetSection.getBoundingClientRect();
      const offset = e.clientY - boundingBox.top;

      if (offset < boundingBox.height / 2) {
        sectionContainer.insertBefore(draggedItem, targetSection);
      } else {
        sectionContainer.insertBefore(draggedItem, targetSection.nextSibling);
      }
      targetSection.classList.remove("drag-over-top", "drag-over-bottom");
      manualEditMode = false;
      renderReadme();
    }
    if (draggedItem) draggedItem.classList.remove("dragging");
    draggedItem = null;
  });

  sectionContainer.addEventListener("dragend", (e) => {
    if (draggedItem) draggedItem.classList.remove("dragging");
    draggedItem = null;
    sectionContainer.querySelectorAll(".draggable-section").forEach((section) => {
      section.classList.remove("drag-over-top", "drag-over-bottom");
    });
  });

  // --- Sync markdown editor manual editing ---
  markdownEditor.addEventListener("input", () => {
    manualEditMode = true;
    readmePreview.innerHTML = marked.parse(markdownEditor.value);
    readmePreview.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  });

  // --- Copy markdown button ---
  copyMarkdownButton.addEventListener("click", () => {
    navigator.clipboard.writeText(markdownEditor.value).then(() => {
      alert("Markdown copied to clipboard!");
    });
  });

  // --- Add initial usage and installation sections (optional) ---
  function addInitialSections() {
    const initialInstallation = createDraggableSection("installation");
    sectionContainer.appendChild(initialInstallation);

    const initialUsage = createDraggableSection("usage");
    sectionContainer.appendChild(initialUsage);
  }

  // --- Initialize ---
  addInitialSections();
  renderReadme();

  // --- Project name and description update ---
  projectNameInput.addEventListener("input", renderReadme);
  projectDescriptionTextarea.addEventListener("input", renderReadme);
});
