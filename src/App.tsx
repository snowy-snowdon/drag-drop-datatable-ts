import React, { MutableRefObject, ReactNode } from "react";
import styled from "styled-components";
import {
  useTable,
  useAbsoluteLayout,
  useColumnOrder,
  HeaderGroup,
  Cell,
  Row,
  ColumnInstance,
  TableToggleHideAllColumnProps
} from "react-table";
import {
  DragDropContext,
  Droppable,
  Draggable,
  DragUpdate
} from "react-beautiful-dnd";
import { makeData } from "./makeData";

const Styles = styled.div`
  padding: 1rem;

  * {
    box-sizing: border-box;
  }

  .table {
    border: 1px solid #000;
    max-width: 700px;
    overflow-x: auto;
  }

  .header {
    font-weight: bold;
  }

  .rows {
    overflow-y: auto;
  }

  .row {
    border-bottom: 1px solid #000;
    height: 32px;

    &.body {
      :last-child {
        border: 0;
      }
    }
  }

  .cell {
    height: 100%;
    line-height: 31px;
    border-right: 1px solid #000;
    /* padding-left: 5px; */

    :last-child {
      border: 0;
    }
  }
`;

const getItemStyle = ({ isDragging, isDropAnimating }, draggableStyle) => ({
  ...draggableStyle,
  // some basic styles to make the items look a bit nicer
  userSelect: "none",

  // change background colour if dragging
  background: isDragging ? "lightgreen" : "grey",

  ...(!isDragging && { transform: "translate(0,0)" }),
  ...(isDropAnimating && { transitionDuration: "0.001s" })

  // styles we need to apply on draggables
});

function Table({ columns, data }) {
  // Use the state and functions returned from useTable to build your UI

  const defaultColumn = React.useMemo(
    () => ({
      width: 150
    }),
    []
  );

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    flatColumns,
    setColumnOrder,
    state,
    getToggleHideAllColumnsProps,
    allColumns
  }: {
    getTableProps: any;
    getTableBodyProps: any;
    headerGroups: HeaderGroup<object>[];
    rows: Row<object>;
    prepareRow: (row: Row<object>) => void;
    flatColumns: any;
    setColumnOrder: any;
    state: any;
    getToggleHideAllColumnsProps: TableToggleHideAllColumnProps;
    allColumns: Array<ColumnInstance<object>>;
  } = useTable(
    {
      columns,
      data,
      defaultColumn
    },
    useColumnOrder,
    useAbsoluteLayout
  );
  const currentColOrder = React.useRef();
  const IndeterminateCheckbox: React.ForwardRefExoticComponent<
    {
      indeterminate: ReactNode;
    } & React.RefAttributes<unknown>
  > = React.forwardRef(
    ({ indeterminate, ...rest }: { indeterminate: ReactNode }, ref) => {
      const defaultRef = React.useRef();
      const resolvedRef: MutableRefObject<ReactNode> =
        ref || currentColOrder || defaultRef;

      React.useEffect(() => {
        resolvedRef.current.indeterminate = indeterminate;
      }, [resolvedRef, indeterminate]);

      return <input type="checkbox" ref={resolvedRef} {...rest} />;
    }
  );

  // Render the UI for your table
  return (
    <>
      <div>
        <div>
          <IndeterminateCheckbox {...getToggleHideAllColumnsProps()} /> Toggle
          All
        </div>
        {allColumns.map((column) => (
          <div key={column.id}>
            <label>
              <input type="checkbox" {...column.getToggleHiddenProps()} />{" "}
              {column.id}
            </label>
          </div>
        ))}
        <br />
      </div>
      <div {...getTableProps()} className="table">
        <div>
          {headerGroups.map((headerGroup: HeaderGroup<any>) => (
            <DragDropContext
              onDragStart={() => {
                currentColOrder.current = allColumns?.map(
                  (o) => o.id
                ) as string[];
              }}
              onDragUpdate={(dragUpdateObj: DragUpdate, b) => {
                // console.log("onDragUpdate", dragUpdateObj, b);

                const colOrder = [...allColumns?.map((o) => o.id)];
                const sIndex = dragUpdateObj.source.index;
                const dIndex =
                  dragUpdateObj.destination && dragUpdateObj.destination.index;

                if (typeof sIndex === "number" && typeof dIndex === "number") {
                  colOrder.splice(sIndex, 1);
                  colOrder.splice(dIndex, 0, dragUpdateObj.draggableId);
                  setColumnOrder(colOrder);

                  // console.log(
                  //   "onDragUpdate",
                  //   dragUpdateObj.destination.index,
                  //   dragUpdateObj.source.index
                  // );
                  // console.log(temp);
                }
              }}
            >
              <Droppable droppableId="droppable" direction="horizontal">
                {(droppableProvided, snapshot) => (
                  <div
                    {...headerGroup.getHeaderGroupProps()}
                    ref={droppableProvided.innerRef}
                    className="row header-group"
                  >
                    {headerGroup.headers.map((column, index) => (
                      <Draggable
                        key={column.id}
                        draggableId={column.id}
                        index={index}
                        isDragDisabled={!column.accessor}
                      >
                        {(provided, snapshot) => {
                          console.log(column.getHeaderProps());

                          const {
                            style,
                            ...extraProps
                          } = column.getHeaderProps();

                          console.log(style, extraProps);

                          return (
                            <div
                              {...column.getHeaderProps()}
                              className="cell header"
                            >
                              <div
                                {...provided.draggableProps}
                                {...provided.dragHandleProps}
                                // {...extraProps}
                                ref={provided.innerRef}
                                style={{
                                  ...getItemStyle(
                                    snapshot,
                                    provided.draggableProps.style
                                  )
                                  // ...style
                                }}
                              >
                                {column.render("Header")}
                              </div>
                            </div>
                          );
                        }}
                      </Draggable>
                    ))}
                    {droppableProvided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>
          ))}
        </div>

        <div className="rows" {...getTableBodyProps()}>
          {rows.map(
            (row: Row<object>) =>
              prepareRow(row) || (
                <div {...row.getRowProps()} className="row body">
                  {row.cells.map((cell: Cell<object, any>) => {
                    return (
                      <div {...cell.getCellProps()} className="cell">
                        {cell.render("Cell")}
                      </div>
                    );
                  })}
                </div>
              )
          )}
        </div>
      </div>
      <pre>
        <code>{JSON.stringify(state, null, 2)}</code>
      </pre>
    </>
  );
}

function App() {
  const columns = React.useMemo(
    () => [
      {
        Header: "First Name",
        accessor: "firstName"
      },
      {
        Header: "Last Name",
        accessor: "lastName"
      },

      {
        Header: "Age",
        accessor: "age",
        width: 50
      },
      {
        Header: "Visits",
        accessor: "visits",
        width: 60
      },
      {
        Header: "Status",
        accessor: "status"
      },
      {
        Header: "Profile Progress",
        accessor: "progress"
      }
    ],
    []
  );

  const data = React.useMemo(() => makeData(10), []);

  return (
    <Styles>
      <Table columns={columns} data={data} />
    </Styles>
  );
}

export default App;
