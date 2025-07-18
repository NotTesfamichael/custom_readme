document.addEventListener("DOMContentLoaded", () => {
  const sectionContainer = document.getElementById("section-container");
  const projectNameInput = document.getElementById("projectName");
  const projectDescriptionTextarea = document.getElementById("projectDescription");
  const markdownEditor = document.getElementById("markdownEditor");
  const readmePreview = document.getElementById("readmePreview");
  const copyMarkdownButton = document.getElementById("copyMarkdown");
  const addSectionBtn = document.getElementById("add-section-btn");
  const sectionTypeSelect = document.getElementById("section-type-select");

  // Create and insert Load from Markdown button under the markdown editor
  const loadMdBtn = document.createElement("button");
  loadMdBtn.textContent = "Load from Markdown";
  loadMdBtn.className = "btn";
  loadMdBtn.style.marginTop = "10px";
  markdownEditor.parentNode.appendChild(loadMdBtn);

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
    generic: "New Section",
  };

  // Auto-resize textarea helper
  function autoResizeTextarea(textarea) {
    textarea.style.height = "auto";
    textarea.style.height = textarea.scrollHeight + "px";
  }

  function attachSectionListeners(sectionElement) {
    const textarea = sectionElement.querySelector(".section-content-textarea");
    if (textarea) {
      textarea.addEventListener("input", () => {
        autoResizeTextarea(textarea);
        manualEditMode = false;
        renderReadme();
      });
      autoResizeTextarea(textarea);
    }

    const titleInput = sectionElement.querySelector(".section-title-input");
    if (titleInput) {
      titleInput.addEventListener("input", () => {
        manualEditMode = false;
        renderReadme();
      });
    }

    const removeBtn = sectionElement.querySelector(".remove-section-btn");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        sectionElement.remove();
        manualEditMode = false;
        renderReadme();
      });
    }
  }

  // Installation Step element
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
      // Parse content as JSON or empty array
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
      let placeholderText = `Content for ${type.charAt(0).toUpperCase() + type.slice(1)} section...`;
      let sectionTitle = title || defaultTitles[type] || "New Section";

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

  // Parse markdown text into section objects [{title, content}, ...]
  function parseMarkdownToSections(markdownText) {
    const lines = markdownText.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach(line => {
      const headerMatch = line.match(/^##+\s+(.*)/);
      if (headerMatch) {
        if (currentSection) sections.push(currentSection);
        currentSection = { title: headerMatch[1].trim(), content: "" };
      } else if (currentSection) {
        currentSection.content += line + "\n";
      }
    });

    if (currentSection) sections.push(currentSection);
    return sections;
  }

  // Map heading title to a section type for form
  function getSectionTypeFromTitle(title) {
    const lower = title.toLowerCase();

    if (lower.includes("feature")) return "features";
    if (lower.includes("install")) return "installation";
    if (lower.includes("usage")) return "usage";
    if (lower.includes("contribute")) return "contributing";
    if (lower.includes("license")) return "license";
    if (lower.includes("acknowledgment")) return "acknowledgments";
    if (lower.includes("link")) return "links";
    return "generic";
  }

  addSectionBtn.addEventListener("click", () => {
    const selectedType = sectionTypeSelect.value;
    const newSection = createDraggableSection(selectedType);
    sectionContainer.appendChild(newSection);
    manualEditMode = false;
    renderReadme();
  });

  // Drag & drop handlers
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

  // When user clicks "Load from Markdown" button:
  loadMdBtn.addEventListener("click", () => {
    const markdown = markdownEditor.value.trim();
    if (!markdown) return alert("Please paste some Markdown first!");

    // Parse markdown to sections
    const parsedSections = parseMarkdownToSections(markdown);

    // Clear existing sections except project info (keep it static)
    [...sectionContainer.querySelectorAll(".form-section.draggable-section")].forEach(el => el.remove());

    // Load parsed sections into form
    parsedSections.forEach(({ title, content }) => {
      const type = getSectionTypeFromTitle(title);
      // Special case: Installation steps expect JSON array of steps - try parse steps out of content
      if (type === "installation") {
        // Try to parse multiple installation steps from markdown content
        // We try to parse sub-headers ### Step X and their code blocks

        // Regex to capture step titles and code blocks
        const stepRegex = /###\s*(.*)\n([\s\S]*?)(?=(\n###|$))/g;
        const steps = [];
        let match;
        while ((match = stepRegex.exec(content)) !== null) {
          const stepTitle = match[1].trim();
          const stepCodeRaw = match[2].trim();

          // Remove markdown code fences if present
          let stepCode = stepCodeRaw;
          const codeFenceMatch = stepCodeRaw.match(/^```(\w*)\n([\s\S]*)\n```$/);
          if (codeFenceMatch) {
            stepCode = codeFenceMatch[2].trim();
          }

          steps.push({ stepTitle, stepCode });
        }

        if (steps.length === 0) {
          // fallback: treat whole content as one step with no title
          steps.push({ stepTitle: "", stepCode: content.trim() });
        }

        // Pass steps array as JSON string in content param
        content = JSON.stringify(steps);
      }

      const newSection = createDraggableSection(type, title.trim(), content.trim());
      sectionContainer.appendChild(newSection);
    });

    manualEditMode = false;
    renderReadme();

    // Scroll to top so user sees changes
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  function addInitialSections() {
    const initialInstallation = createDraggableSection("installation");
    const initialFeatures = createDraggableSection("features");
    const initialUsage = createDraggableSection("usage");
 

    sectionContainer.appendChild(initialInstallation);
    sectionContainer.appendChild(initialFeatures);
    sectionContainer.appendChild(initialUsage);
  }

  addInitialSections();
  renderReadme();
});
