export type RowData = {
  level: string;
  data: { [propertyName: string]: any };
};
export type ColumnElement = HTMLTableCellElement & { column: { name: string } };
export type RowElement = HTMLTableRowElement & {
  rowData: RowData;
};

export class HTMLTable {
  public readonly tableElement: HTMLTableElement;

  constructor(tableElement: HTMLTableElement) {
    this.tableElement = tableElement;

    if (!this.tableElement.querySelector("thead")) {
      // create a thead element.
      tableElement.createTHead();
    }

    if (!this.tableElement.querySelector("tbody")) {
      this.tableElement.createTBody();
    }
  }

  private addRow(rowData: RowData) {
    // add missing columns.
    const propertyNames = Object.getOwnPropertyNames(rowData.data);
    const existingColumnNames = [...this.tableElement.tHead!.querySelectorAll("th")].map((th) => (th as ColumnElement).column.name);

    const missingNames = propertyNames.filter((propName) => !existingColumnNames.some((cn) => cn == propName));

    missingNames.forEach((n) => this.addColumn(n));

    // Add data.
    let newRow = this.tableElement.tBodies[0].insertRow() as RowElement;
    newRow.classList.add(`tr-${rowData.level}`);
    newRow.rowData = rowData;

    let current = this.tableElement.tHead!.firstChild as ColumnElement;
    while (current) {
      let cell = newRow.insertCell();
      cell.textContent = newRow.rowData.data[current.column.name] || "";
      if(current.classList.contains("hidden")) {
        cell.classList.add("hidden");
      }
      current = current.nextSibling as ColumnElement;
    }
  }

  public addColumn(name: string) {
    let thElement = document.createElement("th") as ColumnElement;
    thElement.column = { name };
    thElement.textContent = name;

    // add to the end, so all existing column index is not changed.
    this.tableElement.tHead!.append(thElement);
  }

  public addData(dataList: RowData[]) {
    dataList.forEach((item) => this.addRow(item));
  }

  public clearData(): void {
    [...this.tableElement.tBodies].forEach((b) => b.remove());
    this.tableElement.createTBody();

    this.tableElement.tHead?.remove();
    this.tableElement.createTHead();
  }
}
