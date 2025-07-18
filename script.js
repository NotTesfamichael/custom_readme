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
    installation: "Installation Steps",
    usage: "Usage",
    features: "Features",
    contributing: "Contributing",
    license: "License",
    links: "Links/Resources",
    acknowledgments: "Acknowledgments",
  };

  // Auto-resize textarea helper
  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  function attachSectionListeners(sectionElement) {
    // For generic sections (single textarea)
    const textarea = sectionElement.querySelector(".section-content-textarea");
    if (textarea) {
      textarea.addEventListener("input", () => {
        autoResizeTextarea(textarea);
        manualEditMode = false;
        renderReadme();
      });
      autoResizeTextarea(textarea);
    }

    // For generic section title input
    const titleInput = sectionElement.querySelector(".section-title-input");
    if (titleInput) {
      titleInput.addEventListener("input", () => {
        manualEditMode = false;
        renderReadme();
      });
    }

    // For remove section button
    const removeBtn = sectionElement.querySelector(".remove-section-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        sectionElement.remove();
        manualEditMode = false;
        renderReadme();
      });
    }
  }

  // Create an installation step element (step title + code)
  function createInstallationStepElement(step = { stepTitle: "", stepCode: "" }) {
    const stepDiv = document.createElement("div");
    stepDiv.classList.add("installation-step");
    stepDiv.style.marginBottom = "1rem";

    stepDiv.innerHTML = `
      <input type="text" class="step-title-input" placeholder="Step title (e.g. Step 1: Install Dependencies)" value="${step.stepTitle}" />
      <textarea class="step-code-textarea" rows="4" placeholder="Code or instructions for this step...">${step.stepCode}</textarea>
      <button class="remove-step-btn btn" style="background:#dc3545; margin-top:5px;">Remove Step</button>
      <hr />
    `;

    const textarea = stepDiv.querySelector(".step-code-textarea");
    textarea.addEventListener("input", () => {
      textarea.style.height = "auto";
      textarea.style.height = textarea.scrollHeight + "px";
      manualEditMode = false;
      renderReadme();
    });
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";

    const removeStepBtn = stepDiv.querySelector(".remove-step-btn");
    removeStepBtn.addEventListener("click", () => {
      stepDiv.remove();
      manualEditMode = false;
      renderReadme();
    });

    const stepTitleInput = stepDiv.querySelector(".step-title-input");
    stepTitleInput.addEventListener("input", () => {
      manualEditMode = false;
      renderReadme();
    });

    return stepDiv;
  }

  function createDraggableSection(type, title = "", content = "") {
    const sectionDiv = document.createElement("div");
    sectionDiv.classList.add("form-section", "draggable-section");
    sectionDiv.dataset.sectionId = type;
    sectionDiv.setAttribute("draggable", "true");

    if (type === "installation") {
      // parse content as JSON for steps or empty array
      let steps = [];
      try {
        steps = JSON.parse(content);
        if (!Array.isArray(steps)) steps = [];
      } catch {
        steps = [];
      }
      if (steps.length === 0) steps = [{ stepTitle: "", stepCode: "" }];

      sectionDiv.innerHTML = `
        <h3 class="section-handle">
          <input type="text" class="section-title-input" value="${title || defaultTitles.installation}" />
          <span class="drag-icon">⠿</span>
        </h3>
        <div class="steps-container"></div>
        <button class="add-step-btn btn" style="margin-top: 8px;">Add Installation Step</button>
        <button class="remove-section-btn" style="margin-top: 10px;">Remove Section</button>
      `;

      const stepsContainer = sectionDiv.querySelector(".steps-container");
      steps.forEach((step) => {
        stepsContainer.appendChild(createInstallationStepElement(step));
      });

      const addStepBtn = sectionDiv.querySelector(".add-step-btn");
      addStepBtn.addEventListener("click", () => {
        stepsContainer.appendChild(createInstallationStepElement());
      });

      attachSectionListeners(sectionDiv);
    } else {
      // Other sections: single textarea and optional title input
      let placeholderText = `Content for ${type.charAt(0).toUpperCase() + type.slice(1)} section...`;
      let sectionTitle = title || defaultTitles[type] || "New Section Title";

      sectionDiv.innerHTML = `
        <h3 class="section-handle">
          <input type="text" class="section-title-input" value="${sectionTitle}">
          <span class="drag-icon">⠿</span>
        </h3>
        <div class="form-group">
          <textarea class="section-content-textarea" rows="4" placeholder="${placeholderText}">${content}</textarea>
        </div>
        <button class="remove-section-btn">Remove</button>
      `;

      attachSectionListeners(sectionDiv);

      const textarea = sectionDiv.querySelector(".section-content-textarea");
      if (textarea) autoResizeTextarea(textarea);
    }

    return sectionDiv;
  }

  function getSectionContent(sectionElement) {
    const sectionType = sectionElement.dataset.sectionId;

    if (sectionType === "installation") {
      const titleInput = sectionElement.querySelector(".section-title-input");
      const sectionTitle = titleInput ? titleInput.value.trim() || defaultTitles.installation : defaultTitles.installation;

      const stepsContainer = sectionElement.querySelector(".steps-container");
      if (!stepsContainer) return "";

      const steps = [];
      stepsContainer.querySelectorAll(".installation-step").forEach((stepDiv) => {
        const stepTitleInput = stepDiv.querySelector(".step-title-input");
        const stepCodeTextarea = stepDiv.querySelector(".step-code-textarea");

        const stepTitle = stepTitleInput ? stepTitleInput.value.trim() : "";
        const stepCode = stepCodeTextarea ? stepCodeTextarea.value.trim() : "";

        if (stepTitle || stepCode) {
          steps.push({ stepTitle, stepCode });
        }
      });

      if (steps.length === 0) return "";

      let markdown = `## ${sectionTitle}\n\n`;
      steps.forEach(({ stepTitle, stepCode }, idx) => {
        markdown += `### ${stepTitle || `Step ${idx + 1}`}\n\n`;
        if (stepCode) {
          if (/^```/.test(stepCode)) {
            markdown += `${stepCode}\n\n`;
          } else {
            markdown += "```\n" + stepCode + "\n```\n\n";
          }
        } else {
          markdown += "\n";
        }
      });
      return markdown;
    }

    // Other sections (project-info, features, usage, contributing, etc.)
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
    // Add installation section with one default step
    const initialInstallation = createDraggableSection("installation");
    sectionContainer.appendChild(initialInstallation);

    // Add usage section (normal single textarea)
    const initialUsage = createDraggableSection("usage");
    sectionContainer.appendChild(initialUsage);
  }

  addInitialSections();
  renderReadme();

  projectNameInput.addEventListener("input", renderReadme);
  projectDescriptionTextarea.addEventListener("input", renderReadme);

});
