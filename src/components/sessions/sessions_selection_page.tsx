import fetchRecordings from '../../models/recordings/fetch_recordings';
import Recording from '../../models/recordings/recording';

import dateOrNow from '../../utilities/date_time/date_or_now';
import formatDuration from '../../utilities/date_time/format_duration';
import { formatOptionalTimestamp, formatTimestamp } from '../../utilities/date_time/format_timestamp';
import hasValue from '../../utilities/optional/has_value';

import {
  ColDef,
  DateDataTypeDefinition,
  GridState,
  NavigateToNextCellParams,
  RowDoubleClickedEvent,
  RowSelectedEvent,
  SelectionChangedEvent,
  ValueFormatterLiteParams,
  ValueParserLiteParams
} from 'ag-grid-community';

import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

import {
  AgGridReact,
  CustomCellRendererProps
} from 'ag-grid-react';

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';

import { useNavigate } from 'react-router-dom';

import {
  Button,
  Col,
  Container,
  Row,
  Stack,
  Toast,
  ToastContainer
} from 'react-bootstrap';
import { parseOptionalDate } from '../../utilities/date_time/parse_date';

interface PageProperties {
  isUserLoggedIn: () => boolean;
}

function SessionsSelectPage(props: PageProperties) {
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showError, setShowError] = useState(false);
  const toggleShowError = () => setShowError(!showError);

  const navigate = useNavigate();

  useEffect(() => {
      !props.isUserLoggedIn() && navigate('/');
    },
    [navigate, props]);

  const gridRef = useRef<AgGridReact<Recording>>(null);

  const [selectedRow, setSelectedRow] = useState<Recording>();

  const onOpenRecording = useCallback((recording: Recording | undefined) => {
      if (!recording) {
        return;
      }

      navigate('/sessions/id');
    },
    [navigate]);

  const finishTimestampCellRenderer = (params: CustomCellRendererProps<Recording, Date>) => (
    hasValue(params.value)
    ? formatTimestamp(params.value!)
    : (
        <span className="imgSpanLiveFeed" >
          <img
            className="live-feed-icon"
            src="/img/live-feed.png"
            height={40}
            width="auto"
          />
        </span>
      )
  );

  const durationCellRenderer = (params: CustomCellRendererProps<Recording, number>) => (
    hasValue(params.node.data?.startTimestamp) &&
    formatDuration(params.node.data!.startTimestamp,
                   dateOrNow(params.node.data!.finishTimestamp))
  );

  const [rows, setRows] = useState<Recording[]>([]);

  const loadRows = async () => {
    fetchRecordings()
    .then((recordings) => {
      setRows(recordings);
    })
    .catch((error) => {
      setRows([]);
      setErrorTitle('Failed to fetch the recording sessions.');
      const errorMessage = `${error}`.split(':').pop() ?? `${error}`;
      setErrorMessage(errorMessage);
      setShowError(true);
    });
  };

  useEffect(() => { loadRows() }, []);

  const [colDefs] = useState<ColDef[]>([
    {
      cellDataType: 'text',
      field: 'instituteId',
      headerName: 'Institute ID'
    },
    {
      cellDataType: 'text',
      field: 'patientId',
      headerName: 'Patient ID'
    },
    {
      cellDataType: 'date',
      field: 'startTimestamp',
      filter: 'agDateColumnFilter',
      headerName: 'Starting Time'
    },
    {
      cellDataType: 'date',
      field: 'finishTimestamp',
      filter: 'agDateColumnFilter',
      headerName: 'Finishing Time',
      cellRenderer: finishTimestampCellRenderer,
      comparator: (lhs: Date | null | undefined, rhs: Date | null | undefined) => {
        return (lhs === rhs)  ? 0
             : !hasValue(lhs) ? 1
             : !hasValue(rhs) ? -1
             : (lhs! > rhs!)  ? 1
             : -1;
      }
    },
    {
      cellDataType: 'number',
      field: 'duration',
      filter: false,
      headerName: 'Duration',
      cellRenderer: durationCellRenderer
    }
  ]);

  const defaultColDef = useMemo<ColDef<Recording>>(() => {
      return {
        autoHeight: true,
        autoHeaderHeight: true,
        cellClass: 'ag-left-aligned-cell',
        editable: false,
        filter: true,
        floatingFilter: true
      };
    },
    []);

  const dataTypeDefinitions = useMemo<{[cellDataType: string]: DateDataTypeDefinition<Recording>;}>(() => {
      return {
        date: {
          baseDataType: 'date',
          extendsDataType: 'date',

          valueParser: (params: ValueParserLiteParams<Recording, Date>) =>
            parseOptionalDate(params.newValue) ?? null,

          valueFormatter: (params: ValueFormatterLiteParams<Recording, Date>) =>
            formatOptionalTimestamp(params.value) ?? ''
        }
      };
    },
    []);

  //
  // The grid initial presentation is to present the recording sessions in the following order.
  //  - currently an ongoing live-feed
  //  - most recently finished
  //  - most recently started
  //  - institution
  //  - patient
  //
  const gridInitialState = useMemo<GridState>(() => {
      return {
        sort: {
          sortModel: [
            { colId: 'finishTimestamp', sort: 'desc' },
            { colId: 'startTimestamp',  sort: 'desc' },
            { colId: 'instituteId',     sort: 'asc' },
            { colId: 'patientId',       sort: 'asc' }
          ]
        }
      };
    },
    []);

  const pagination = true;
  const paginationPageSize = 25;
  const paginationPageSizeSelector = [
    paginationPageSize,
    paginationPageSize * 2,
    paginationPageSize * 4
  ];

  const navigateToNextCell = (params : NavigateToNextCellParams<Recording>) => {
    const suggestedNextCell = params.nextCellPosition;

    const KEY_UP = 'ArrowUp';
    const KEY_DOWN = 'ArrowDown';

    if (suggestedNextCell && (params.key === KEY_DOWN || params.key === KEY_UP)) {
      params.api.getDisplayedRowAtIndex(suggestedNextCell.rowIndex)?.setSelected(true);
    }

    return suggestedNextCell;
  };

  const onRowDoubleClicked = useCallback((event: RowDoubleClickedEvent<Recording>) =>
      onOpenRecording(event.data),
    [onOpenRecording]);

  const onRowSelected = useCallback((event: RowSelectedEvent<Recording>) =>
      setSelectedRow(event.data),
    [setSelectedRow]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent<Recording>) =>
      setSelectedRow(event.api.getSelectedNodes()?.at(0)?.data),
    [setSelectedRow]);

  return (
    <Container>
      <Stack>
        <div className="vr" />
        <div className="vr" />
        <Row>
          <Col md={{ span: 1, offset: 0 }} >
            <Button
              onClick={() => onOpenRecording(selectedRow)}
              disabled={!hasValue(selectedRow)}
            >
              Open
            </Button>
          </Col>
          <Col md={{ span: 0, offset: 3 }}>
            <div>
              <ToastContainer>
                <Toast
                  bg="danger"
                  show={showError}
                  onClose={toggleShowError}
                >
                  <Toast.Header>
                    <strong>
                      {errorTitle}
                    </strong>
                  </Toast.Header>
                  <Toast.Body>
                    {errorMessage}
                  </Toast.Body>
                </Toast>
              </ToastContainer>
            </div>
          </Col>
          <Col md={{ span: 0, offset: 6 }} >
            <Button
              onClick={ loadRows }
            >
              Refresh
            </Button>
          </Col>
        </Row>
        <div className="vr" />
        <div
          className="ag-theme-quartz-dark"
          style={{
            height: 500,
            width: 1040,
          }}
        >
          <AgGridReact<Recording>
            initialState={gridInitialState}
            columnDefs={colDefs}
            dataTypeDefinitions={dataTypeDefinitions}
            defaultColDef={defaultColDef}
            navigateToNextCell={navigateToNextCell}
            onRowDoubleClicked={onRowDoubleClicked}
            onRowSelected={onRowSelected}
            onSelectionChanged={onSelectionChanged}
            pagination={pagination}
            paginationPageSize={paginationPageSize}
            paginationPageSizeSelector={paginationPageSizeSelector}
            ref={gridRef}
            rowData={rows}
            rowSelection={'single'}
            suppressCellFocus={true}
            suppressRowClickSelection={false}
          />
        </div>
      </Stack>
    </Container>
  );
}

export default SessionsSelectPage;
