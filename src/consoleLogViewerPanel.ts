import $ from "jquery";
import { HTMLTable, RowData } from "./HTMLTable";

// The th element under thead
export type ConsoleLogViewerPanelWindow = Window &
  typeof globalThis & {
    tables: Map</*tableName*/ string, HTMLTable>;
    addData: (dataList: RowData[]) => void;
    disablePanel: () => void;
    shouldCapture: boolean;
  };

let resizeObserver: ResizeObserver;
$(function () {
  resizeObserver = new ResizeObserver(onTableResize);
  (window as ConsoleLogViewerPanelWindow).tables = new Map();
  (window as ConsoleLogViewerPanelWindow).addData = (dataList: RowData[]) => {
    for (const rowData of dataList) {
      const tableName = getTableName(rowData);

      const tableMapping = (window as ConsoleLogViewerPanelWindow).tables;
      if (!tableMapping.has(tableName)) {
        const newTable = createTable(tableName);
        tableMapping.set(tableName, newTable);
      }

      // add data to the corresponding table.
      tableMapping.get(tableName)?.addData([rowData]);
    }
  };

  (window as ConsoleLogViewerPanelWindow).disablePanel = () => {
    // remove current modal dialog.
    document.querySelector(".modalDialog")?.remove();

    // create a modal dialog
    const modalDialog = document.createElement("div");
    modalDialog.classList.add("modalDialog");
    const contentBox = document.createElement("div");
    contentBox.classList.add("modalDialogContentBox");
    contentBox.textContent = "Console log viewer is disabled. Please enable it in the extension popup.";
    modalDialog.appendChild(contentBox);
    document.body.appendChild(modalDialog);
  };

  $("#toggleCapture").on("change", (e) => {
    (window as ConsoleLogViewerPanelWindow).shouldCapture = (e.target as HTMLInputElement).checked;
  });

  $("#btnClear").on("click", (e) => {
    // clear all table data.
    (window as ConsoleLogViewerPanelWindow).tables.clear();
    $("#tableContainer").empty();
  });

  $("#btnExpandAll").on("click", (e) => {
    this.documentElement.querySelectorAll(".collapsibleButton").forEach((btn) => {
      const tableWrapper = btn.parentElement as HTMLDivElement;
      var content = tableWrapper.querySelector(".collapsibleContent") as HTMLDivElement;

      // button active.
      btn.classList.add("active");

      // expand content
      content.classList.remove("collapsed");
    });
  });

  $("#btnCollapseAll").on("click", (e) => {
    this.documentElement.querySelectorAll(".collapsibleButton").forEach((btn) => {
      const tableWrapper = btn.parentElement as HTMLDivElement;
      var content = tableWrapper.querySelector(".collapsibleContent") as HTMLDivElement;

      // button active.
      btn.classList.remove("active");

      // expand content
      content.classList.add("collapsed");
    });
  });

  $("#txtTableFilter").on("input", (e) => {
    // Only show tables that match the filter.
    // find all table wrappers.
    const tableWrappers = document.querySelectorAll(".tableWrapper");
    tableWrappers.forEach((tableWrapper) => {
      const tableName = tableWrapper.getAttribute("table");
      const filter = (e.target as HTMLInputElement).value;
      if (tableName && filter.length > 0 && !tableName.toLocaleLowerCase().includes(filter.toLocaleLowerCase())) {
        tableWrapper.classList.add("hidden");
      } else {
        tableWrapper.classList.remove("hidden");
      }
    });
  });
});

function getTableName(rowData: RowData): string {
  // compute table name.
  if (!rowData.data["namespace"]) {
    return "unknown_namespace";
  }

  if (rowData.data["category"] === "Activity") {
    return `${rowData.data["namespace"]}_${rowData.data["category"]}_${rowData.data["eventName"]}`;
  } else {
    return `${rowData.data["namespace"]}_${rowData.data["category"] ?? "unknownCategory"}`;
  }
}

function createTable(tableName: string): HTMLTable {
  let containerElement = document.querySelector("#tableContainer") as HTMLDivElement;

  const tableWrapper = document.createElement("div");
  tableWrapper.classList.add("tableWrapper");
  tableWrapper.style.marginBottom = "10px";
  tableWrapper.setAttribute("table", tableName);

  // apply table filter
  const tableFilter = (document.querySelector("#txtTableFilter") as HTMLInputElement).value;
  if (tableFilter && tableFilter.length > 0 && !tableName.toLocaleLowerCase().includes(tableFilter.toLocaleLowerCase())) {
    tableWrapper.classList.add("hidden");
  } else {
    tableWrapper.classList.remove("hidden");
  }

  const collapseButton = document.createElement("button");
  collapseButton.textContent = tableName;
  collapseButton.classList.add("collapsibleButton");
  collapseButton.classList.add("tableCollapsibleButton");
  collapseButton.addEventListener("click", (e) => {
    collapseButton.classList.toggle("active");
    var content = tableWrapper.querySelector(".collapsibleContent");
    content?.classList.toggle("collapsed");
  });
  tableWrapper.appendChild(collapseButton);

  // Add content container
  const contentContainer = document.createElement("div");
  contentContainer.classList.add("collapsibleContent");
  contentContainer.classList.add("collapsed");
  tableWrapper.appendChild(contentContainer);

  // table column chooser.
  const tableColumnChooser = document.createElement("button");
  tableColumnChooser.textContent = "Choose Columns";
  tableColumnChooser.addEventListener("click", (e) => {
    popUpColumnChooserDialog(tableName);
  });
  contentContainer.appendChild(tableColumnChooser);

  // table.
  const tableElement = document.createElement("table");
  tableElement.appendChild(document.createElement("thead"));
  tableElement.appendChild(document.createElement("tbody"));
  contentContainer.appendChild(tableElement);

  // add a horizontal scrollbar.
  const scrollbar = document.createElement("div");
  scrollbar.classList.add("scrollbar");
  const scrollContent = document.createElement("div");
  scrollContent.classList.add("scrollContent");
  scrollbar.appendChild(scrollContent);
  scrollbar.addEventListener("scroll", () => {
    tableElement.style.left = -scrollbar.scrollLeft + "px";
  });
  contentContainer.appendChild(scrollbar);

  // observer table element size to update scrollbar.
  resizeObserver.observe(tableElement);

  containerElement.appendChild(tableWrapper);

  return new HTMLTable(tableElement);
}

function onTableResize(entries: ResizeObserverEntry[], observer: ResizeObserver): void {
  entries.forEach((entry) => {
    const tableElement = entry.target as HTMLTableElement;
    const scrollbar = tableElement.nextElementSibling;
    const scrollableContent = scrollbar?.firstElementChild as HTMLDivElement;
    if (scrollableContent?.classList.contains("scrollContent")) {
      scrollableContent.style.width = `${tableElement.scrollWidth}px`;
    }
  });
}

function popUpColumnChooserDialog(tableName: string) {
  const tableMapping = (window as ConsoleLogViewerPanelWindow).tables;
  const table = tableMapping.get(tableName);
  if (!table || !table.tableElement.tHead) {
    return;
  }
  const columns = [...table.tableElement.tHead.querySelectorAll("th")].map((th) => {
    return {
      name: th.textContent,
      isHidden: th.classList.contains("hidden"),
      columnElement: th,
    };
  });

  // open a modal dialog with all the column names.
  const modalDialog = document.createElement("div");
  modalDialog.classList.add("modalDialog");
  modalDialog.classList.add("columnChooserModalDialog");
  const contentBox = document.createElement("div");
  contentBox.classList.add("modalDialogContentBox");
  contentBox.classList.add("columnChooserDialogContentBox");
  contentBox.style.fontSize = "15px";

  // add a header div
  const headerDiv = document.createElement("div");
  headerDiv.classList.add("inline");
  headerDiv.style.width = "100%";
  headerDiv.style.textAlign = "center";
  const headerLabel = document.createElement("h1");
  headerLabel.textContent = `Choose Columns - ${tableName}`;
  headerLabel.style.fontWeight = "bold";
  headerLabel.style.color = "black";
  headerDiv.appendChild(headerLabel);
  contentBox.appendChild(headerDiv);

  // Add a checkAll/unCheckAll button to header div.
  const checkAllCheckbox = document.createElement("input");
  checkAllCheckbox.type = "checkbox";
  checkAllCheckbox.checked = true;
  checkAllCheckbox.addEventListener("change", (e) => {
    // query all the checkboxes in the current dialog and update checked state for all.
    const checkboxes = [...modalDialog.querySelectorAll("input[type='checkbox']")] as HTMLInputElement[];
    for (const checkbox of checkboxes) {
      checkbox.checked = checkAllCheckbox.checked;
      checkbox.dispatchEvent(new Event("change"));
    }
  });
  const checkAllLabel = document.createElement("label");
  checkAllLabel.textContent = "Check/Uncheck All";
  checkAllLabel.style.fontWeight = "bold";
  const checkAllDiv = document.createElement("div");
  checkAllDiv.style.textAlign = "center";
  checkAllDiv.appendChild(checkAllCheckbox);
  checkAllDiv.appendChild(checkAllLabel);
  headerDiv.appendChild(checkAllDiv);

  // column names div.
  const columnNamesDiv = document.createElement("div");
  columnNamesDiv.classList.add("columnNamesWrapper");
  contentBox.appendChild(columnNamesDiv);

  // add column names.
  for (const column of columns) {
    const columnDiv = document.createElement("div");
    columnDiv.classList.add("columnWrapper");
    columnDiv.classList.add("inline");
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = !column.isHidden;
    (checkbox as any).columnElement = column.columnElement;
    checkbox.addEventListener("change", (e) => {
      const checkbox = e.target as HTMLInputElement;
      if (checkbox.checked) {
        column.columnElement.classList.remove("hidden");
      } else {
        column.columnElement.classList.add("hidden");
      }

      const tableCells = [...table.tableElement.querySelectorAll(`tbody td:nth-child(${columns.indexOf(column) + 1})`)];
      for (const tableCell of tableCells) {
        if (checkbox.checked) {
          tableCell.classList.remove("hidden");
        } else {
          tableCell.classList.add("hidden");
        }
      }
    });
    columnDiv.appendChild(checkbox);
    const label = document.createElement("label");
    label.textContent = column.name;
    label.title = column.name || "";
    columnDiv.appendChild(label);
    columnNamesDiv.appendChild(columnDiv);
  }

  // add a close button to the dialog
  const closeButton = document.createElement("button");
  closeButton.textContent = "Close";
  closeButton.addEventListener("click", (e) => {
    modalDialog.remove();
  });
  const closeDiv = document.createElement("div");
  closeDiv.classList.add("closeDiv");
  closeDiv.appendChild(closeButton);
  contentBox.appendChild(closeDiv);

  modalDialog.appendChild(contentBox);
  document.body.appendChild(modalDialog);
}
