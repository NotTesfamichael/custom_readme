document.addEventListener("DOMContentLoaded", () => {
  const sectionContainer = document.getElementById("section-container");
  const projectNameInput = document.getElementById("projectName");
  const projectDescriptionTextarea = document.getElementById("projectDescription");
  const markdownEditor = document.getElementById("markdownEditor");
  const readmePreview = document.getElementById("readmePreview");
  const copyMarkdownButton = document.getElementById("copyMarkdown");
  const addSectionBtn = document.getElementById("add-section-btn");
  const sectionTypeSelect = document.getElementById("section-type-select");

  let draggedItem = null;
  let manualEditMode = false;

  const defaultTitles = {
    installation: "Installation",
    usage: "Usage",
    features: "Features",
    contributing: "Contributing",
    license: "License",
    links: "Links/Resources",
    acknowledgments: "Acknowledgments",
  };

  function attachSectionListeners(sectionElement) {
    sectionElement.querySelector(".section-content-textarea")?.addEventListener("input", () => {
      manualEditMode = false;
      renderReadme();
    });

    sectionElement.querySelector(".section-title-input")?.addEventListener("input", () => {
      manualEditMode = false;
      renderReadme();
    });

    sectionElement.querySelector(".remove-section-btn")?.addEventListener("click", () => {
      sectionElement.remove();
      manualEditMode = false;
      renderReadme();
    });
  }

  function getSectionContent(sectionElement) {
    const sectionType = sectionElement.dataset.sectionId;
    const textarea = sectionElement.querySelector(".section-content-textarea");
    const content = textarea ? textarea.value.trim() : "";

    const titleInput = sectionElement.querySelector(".section-title-input");
    const customTitle = titleInput ? titleInput.value.trim() : "";

    const title = customTitle || defaultTitles[sectionType] || "Section";

    switch (sectionType) {
      case "project-info":
        const projectName = projectNameInput.value.trim();
        const projectDescription = projectDescriptionTextarea.value.trim();
        return `# ${projectName || "Your Project Title"}\n\n${projectDescription || "A brief description of your project."}\n\n`;

      case "installation":
        return content ? `## ${title}\n\n${wrapCodeBlock(content)}\n\n` : "";

      case "usage":
      case "contributing":
      case "acknowledgments":
      case "links":
        return content ? `## ${title}\n\n${content}\n\n` : "";

      case "features":
        let featuresMarkdown = "";
        if (content) {
          featuresMarkdown += `## ${title}\n\n`;
          content.split("\n").forEach((line) => {
            const trimmedLine = line.trim();
            if (trimmedLine) {
              featuresMarkdown += trimmedLine.startsWith("-") || trimmedLine.startsWith("*")
                ? `${trimmedLine}\n`
                : `- ${trimmedLine}\n`;
            }
          });
          featuresMarkdown += "\n";
        }
        return featuresMarkdown;

      case "license":
        return content
          ? `## ${title}\n\nThis project is licensed under the ${content} - see the [LICENSE.md](LICENSE.md) file for details.\n\n`
          : "";

      case "generic":
        return content ? `## ${title}\n\n${content}\n\n` : "";

      default:
        return "";
    }
  }

  function wrapCodeBlock(text) {
    if (/^```[\s\S]*```$/.test(text.trim())) return text;
    return "```\n" + text + "\n```";
  }

  function generateMarkdownFromSections() {
    let fullMarkdown = "";
    const sections = sectionContainer.querySelectorAll(".form-section");

    sections.forEach((section) => {
      fullMarkdown += getSectionContent(section);
    });

    return fullMarkdown;
  }

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

  function createDraggableSection(type, title = "", content = "") {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("form-section", "draggable-section");
    sectionDiv.dataset.sectionId = type;
    sectionDiv.setAttribute("draggable", "true");

    let placeholderText = `Content for ${type.charAt(0).toUpperCase() + type.slice(1)} section...`;

    let sectionTitle = title || defaultTitles[type] || "New Section Title";

    let innerHTML = `
      <h3 class="section-handle">
        <input type="text" class="section-title-input" value="${sectionTitle}">
        <span class="drag-icon">⠿</span>
      </h3>
      <div class="form-group">
        <textarea class="section-content-textarea" rows="4" placeholder="${placeholderText}">${content}</textarea>
      </div>
      <button class="remove-section-btn">Remove</button>
    `;

    sectionDiv.innerHTML = innerHTML;
    attachSectionListeners(sectionDiv);

    return sectionDiv;
  }

  addSectionBtn.addEventListener("click", () => {
    const selectedType = sectionTypeSelect.value;
    const newSection = createDraggableSection(selectedType);
    sectionContainer.appendChild(newSection);
    manualEditMode = false;
    renderReadme();
  });

  sectionContainer.addEventListener("dragstart", (e) => {
    const targetSection = e.target.closest(".draggable-section");
    if (targetSection) {
      draggedItem = targetSection;
      e.dataTransfer.effectAllowed = "move";
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

  sectionContainer.addEventListener("dragend", () => {
    if (draggedItem) draggedItem.classList.remove("dragging");
    draggedItem = null;
    sectionContainer.querySelectorAll(".draggable-section").forEach((section) => {
      section.classList.remove("drag-over-top", "drag-over-bottom");
    });
  });

  markdownEditor.addEventListener("input", () => {
    manualEditMode = true;
    readmePreview.innerHTML = marked.parse(markdownEditor.value);
    readmePreview.querySelectorAll("pre code").forEach((block) => {
      hljs.highlightElement(block);
    });
  });

  copyMarkdownButton.addEventListener("click", () => {
    navigator.clipboard.writeText(markdownEditor.value).then(() => {
      alert("Markdown copied to clipboard!");
    });
  });

  function addInitialSections() {
    const initialInstallation = createDraggableSection("installation");
    sectionContainer.appendChild(initialInstallation);

    const initialUsage = createDraggableSection("usage");
    sectionContainer.appendChild(initialUsage);
  }

  addInitialSections();
  renderReadme();

  projectNameInput.addEventListener("input", renderReadme);
  projectDescriptionTextarea.addEventListener("input", renderReadme);
});
