import { AgGridReact } from 'ag-grid-react';

import { ColDef, NavigateToNextCellParams, RowDoubleClickedEvent, RowSelectedEvent, SelectionChangedEvent } from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import { useCallback, useEffect, useMemo, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { Button, Container } from 'react-bootstrap';

interface PageProperties {
  isUserLoggedIn: () => boolean;
}

interface IRow {
  make: string;
  model: string;
  price: number;
  electric: boolean;
  month: string;
}

function SessionsSelectPage(props: PageProperties) {
  const navigate = useNavigate();

  useEffect(() => {{
    !props.isUserLoggedIn() && navigate('/');
  }}, []);

  const [selectedRow, setSelectedRow] = useState<IRow>();

  const onOpenSession = (session: IRow | undefined) : void => {
    if (!session) {
      return;
    }

    window.alert(`Selected row is ${JSON.stringify(session)}`);
  };

  const [rowData] = useState<IRow[]>([
    { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
    { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October'  },
    { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August'  },
    { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February'  },
    { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January'  },
    { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March'  },
    { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July'  },
    { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September'  },
    { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December'  },
    { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April'  },
    { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November'  },
    { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May'  },
    { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
    { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October'  },
    { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August'  },
    { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February'  },
    { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January'  },
    { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March'  },
    { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July'  },
    { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September'  },
    { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December'  },
    { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April'  },
    { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November'  },
    { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May'  },
    { make: 'Tesla', model: 'Model Y', price: 64950, electric: true, month: 'June' },
    { make: 'Ford', model: 'F-Series', price: 33850, electric: false, month: 'October'  },
    { make: 'Toyota', model: 'Corolla', price: 29600, electric: false, month: 'August'  },
    { make: 'Mercedes', model: 'EQA', price: 48890, electric: true, month: 'February'  },
    { make: 'Fiat', model: '500', price: 15774, electric: false, month: 'January'  },
    { make: 'Nissan', model: 'Juke', price: 20675, electric: false, month: 'March'  },
    { make: 'Vauxhall', model: 'Corsa', price: 18460, electric: false, month: 'July'  },
    { make: 'Volvo', model: 'EX30', price: 33795, electric: true, month: 'September'  },
    { make: 'Mercedes', model: 'Maybach', price: 175720, electric: false, month: 'December'  },
    { make: 'Vauxhall', model: 'Astra', price: 25795, electric: false, month: 'April'  },
    { make: 'Fiat', model: 'Panda', price: 13724, electric: false, month: 'November'  },
    { make: 'Jaguar', model: 'I-PACE', price: 69425, electric: true, month: 'May'  }
  ]);

  const [colDefs] = useState<ColDef[]>([
    {
      field: "make",
      checkboxSelection: true
    },
    { field: "model" },
    {
      field: "price",
      filter: 'agNumberColumnFilter'
    },
    { field: "electric" },
    {
      field: "month",
      comparator: (valueA: string, valueB: string) => {
          const months = [
              'January', 'February', 'March', 'April',
              'May', 'June', 'July', 'August',
              'September', 'October', 'November', 'December',
          ];
          const idxA = months.indexOf(valueA);
          const idxB = months.indexOf(valueB);
          return idxA - idxB;
      }
    }
  ]);

  const defaultColDef = useMemo(() => {
    return {
      filter: 'agTextColumnFilter',
      floatingFilter: true,
    };
  }, []);

  const pagination = true;
  const paginationPageSize = 20;
  const paginationPageSizeSelector = [paginationPageSize, paginationPageSize * 2, paginationPageSize * 4];

  const navigateToNextCell = (params : NavigateToNextCellParams<any>) => {
    const suggestedNextCell = params.nextCellPosition;

    const KEY_UP = 'ArrowUp';
    const KEY_DOWN = 'ArrowDown';

    const noUpOrDownKey = params.key !== KEY_DOWN && params.key !== KEY_UP;
    if (noUpOrDownKey) {
      return suggestedNextCell;
    }

    params.api.forEachNode(node => {
      if (node.rowIndex === suggestedNextCell?.rowIndex) {
        node.setSelected(true);
      }
    });

    return suggestedNextCell;
  };

  const onRowDoubleClicked = useCallback((event: RowDoubleClickedEvent) => {
      onOpenSession(event.data);
    },
    [onOpenSession]
  );

  const onRowSelected = useCallback((event: RowSelectedEvent) => {
      setSelectedRow(event.data);
    },
    [setSelectedRow]
  );

  const onSelectionChanged = useCallback((event: SelectionChangedEvent) => {
      setSelectedRow(event.api.getSelectedNodes()?.at(0)?.data);
    },
    [setSelectedRow]
  );

  return (
    <Container fluid >
      <br /><br /><br /><br /><br /><br /><br />
      <div
      className="ag-theme-quartz"
      style={{
        height: 400,
        width: 1300
      }}
    >
      <AgGridReact
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        navigateToNextCell={navigateToNextCell}
        onRowDoubleClicked={onRowDoubleClicked}
        onRowSelected={onRowSelected}
        onSelectionChanged={onSelectionChanged}
        rowSelection="single"
        suppressCellFocus={true}
        suppressRowClickSelection={false}
        pagination={pagination}
        paginationPageSize={paginationPageSize}
        paginationPageSizeSelector={paginationPageSizeSelector}
        rowData={rowData}
      />
      </div>
      <br /> <br />
      <Button
        onClick={() => onOpenSession(selectedRow)}
        disabled={!selectedRow}
      >
        Open
      </Button>
    </Container>
  );
}

export default SessionsSelectPage;
