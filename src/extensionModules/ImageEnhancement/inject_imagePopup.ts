function onImageElementDoubleClick(e: Event) {
  // create a modal dialog
  const modalDialog = document.createElement("div");
  modalDialog.style.cssText = `    
    position: fixed;
    padding: 50px;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0, 0, 0, 0.5);
    z-index: 9999;
    cursor: grab;
    box-sizing: border-box;
  `;
  const imageWrapper = document.createElement("div");
  imageWrapper.style.cssText = `  
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    position: relative;
    height: 100%;
    width: 100%;
    overflow: auto;
    userSelect: 'none';
  `;
  const modalImage = document.createElement("img");
  modalImage.style.cssText = `
    display: block;
    margin: auto;
    max-width: 100%;
    max-height: 100%;
    object-fit: scale-down;
  `;
  modalImage.draggable = false;
  imageWrapper.appendChild(modalImage);
  modalDialog.appendChild(imageWrapper);
  document.body.appendChild(modalDialog);

  modalImage.src = (e.target as HTMLImageElement).src;

  // used to distinguish between dragging and clicking.
  let isDraggingEvent = false;

  modalImage.addEventListener("click", (e) => {
    if (!isDraggingEvent) {
      modalImage.classList.toggle("expanded");
      const expanded = modalImage.classList.contains("expanded");
      modalImage.style.maxWidth = expanded ? "" : "100%";
      modalImage.style.maxHeight = expanded ? "" : "100%";
      modalImage.style.objectFit = expanded ? "none" : "scale-down";
    }
    e.stopPropagation();
  });

  modalDialog.addEventListener("click", () => {
    modalDialog.remove();
  });

  modalImage.addEventListener("pointerdown", (e) => {
    isDraggingEvent = false;

    const pos = {
      // The current scroll
      left: imageWrapper.scrollLeft,
      top: imageWrapper.scrollTop,
      // Get the current mouse position
      x: e.clientX,
      y: e.clientY,
    };

    const onPointerMove = (e: PointerEvent) => {
      isDraggingEvent = true;

      // How far the mouse has been moved
      const dx = e.clientX - pos.x;
      const dy = e.clientY - pos.y;

      // Scroll the element
      imageWrapper.scrollTop = pos.top - dy;
      imageWrapper.scrollLeft = pos.left - dx;
    };
    const onPointerUp = (e: PointerEvent) => {
      modalImage.removeEventListener("pointermove", onPointerMove);
      modalImage.removeEventListener("pointerup", onPointerUp);
    };

    modalImage.addEventListener("pointermove", onPointerMove);
    modalImage.addEventListener("pointerup", onPointerUp);
  });
}

const observer = new MutationObserver(function (mutationsList, observer) {
  for (const mutation of mutationsList) {
    if (mutation.type === "childList") {
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) {
          const addedElement = node as HTMLElement;
          if (addedElement.classList.contains("scriptor-image")) {
            const imageElement = addedElement.firstElementChild;
            if (imageElement && imageElement.nodeName === "IMG") {
              imageElement.removeEventListener("dblclick", onImageElementDoubleClick);
              imageElement.addEventListener("dblclick", onImageElementDoubleClick);
            }
          }
        }
      });
    }
  }
});

function setup() {
  window.addEventListener("extensionConfig", (ev) => {
    const extensionConfig = (ev as any).detail.extensionConfig;

    if (extensionConfig.enabled && extensionConfig.imagePreviewPopup.enabled) {
      // Double click Image to open image in a pop up div.
      [...document.querySelectorAll(".scriptor-image img")].forEach((imgElement) => {
        imgElement.removeEventListener("dblclick", onImageElementDoubleClick);
        imgElement.addEventListener("dblclick", onImageElementDoubleClick);
      });

      observer.observe(document.body, { attributes: false, childList: true, subtree: true });
    } else {
      [...document.querySelectorAll(".scriptor-image img")].forEach((imgElement) => {
        imgElement.removeEventListener("dblclick", onImageElementDoubleClick);
      });

      // stop observing when it's disabled in extension config.
      observer.disconnect();
    }
  });
}

setup();
