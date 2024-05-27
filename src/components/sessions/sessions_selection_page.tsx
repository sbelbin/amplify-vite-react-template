import {
  AgGridReact,
  CustomCellRendererProps
} from 'ag-grid-react';

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
  Stack
} from 'react-bootstrap';

interface PageProperties {
  isUserLoggedIn: () => boolean;
}

interface Data
{
  folder: URL;
}

interface Video
{
  channelARN?: string;
  channelName?: string;
  folder?: URL;
  playbackURL?: URL;
  streamId?: string;
  streamSessionId?: string;
}

interface Recording
{
  instituteId: string;
  patientId: string;
  sessionId: string;
  startTimestamp: Date;
  finishTimestamp?: Date;
  localTimeZone: string;
  isLiveFeed: boolean;
  data?: Data;
  video?: Video;
}

function SessionsSelectPage(props: PageProperties) {
  const navigate = useNavigate();

  useEffect(() => {{
    !props.isUserLoggedIn() && navigate('/');
  }}, []);

  const gridRef = useRef<AgGridReact<Recording>>(null);

  const [selectedRecording, setSelectedRecording] = useState<Recording>();

  const onOpenRecording = (recording: Recording | undefined) => {
    if (!recording) {
      return;
    }

    window.alert(`Selected recording is ${JSON.stringify(recording)}`);
  };

  const finishTimestampCellRenderer = (params: CustomCellRendererProps<Recording, Date>) => (
    params.value?.toLocaleString('sv-SE') ?? (
      <span
        className="imgSpanLiveFeed"
      >
        <img
          className="live-feed-icon"
          src="/img/live-feed.png"
          height={40}
          width="auto"
        />
      </span>
    )
  );

  const [recordings] = useState<Recording[]>([
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-07T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-07T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-07T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-08T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-08T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-08T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-09T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-09T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-09T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-10T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-10T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-10T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-11T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-11T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-11T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-12T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-12T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-12T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-13T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-13T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-13T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-14T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-14T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-14T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-15T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-15T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-15T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-16T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-16T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-16T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-17T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-17T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-17T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-18T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-18T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-18T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-19T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-19T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-19T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-20T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-20T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-20T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-21T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-21T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-21T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-22T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-22T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-22T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-23T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-23T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-23T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-24T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-24T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-24T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-25T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-25T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-25T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-26T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-26T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-26T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-27T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-27T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-27T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-28T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-28T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-28T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-29T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-29T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-29T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-05-30T12:25:43Z', startTimestamp: new Date(Date.parse('2024-05-30T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-05-30T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-06-01T12:25:43Z', startTimestamp: new Date(Date.parse('2024-06-01T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-06-01T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-06-02T12:25:43Z', startTimestamp: new Date(Date.parse('2024-06-02T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-06-02T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-06-03T12:25:43Z', startTimestamp: new Date(Date.parse('2024-06-03T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-06-03T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-06-04T12:25:43Z', startTimestamp: new Date(Date.parse('2024-06-04T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-06-04T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-06-05T12:25:43Z', startTimestamp: new Date(Date.parse('2024-06-05T12:23:36Z')), finishTimestamp: new Date(Date.parse('2024-06-05T12:25:43Z')), localTimeZone: 'America/Toronto', isLiveFeed: false },
    { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: '2024-06-06T12:25:43Z', startTimestamp: new Date(Date.parse('2024-06-06T12:23:36Z')), finishTimestamp: undefined, localTimeZone: 'America/Toronto', isLiveFeed: true }
  ]);

  const [colDefs] = useState<ColDef[]>([
    {
      cellDataType: 'text',
      field: 'instituteId',
      headerName: 'Institute ID'
    },
    {
      field: 'patientId',
      cellDataType: 'text',
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
      comparator: (lhs: Date | undefined, rhs: Date | undefined) => {
        return (!lhs)        ? 1
             : (!rhs)        ? -1
             : (lhs === rhs) ? 0
             : (lhs > rhs)   ? 1
             : -1;
      }
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
            (params.newValue) ? new Date(Date.parse(params.newValue)) : null,

          valueFormatter: (params: ValueFormatterLiteParams<Recording, Date>) =>
            params.value?.toLocaleString('sv-SE') ?? ''
        }
      };
    },
    []);

  //
  // Upon initial presentation, the order of the recording sessions is the following:
  //  - ongoing live-feed sessions
  //  - most recent based on when it started
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

    if (params.key === KEY_DOWN || params.key === KEY_UP) {
      params.api.forEachNode(node => {
        if (node.rowIndex === suggestedNextCell?.rowIndex) {
          node.setSelected(true);
        }
      });
    }

    return suggestedNextCell;
  };

  const onRowDoubleClicked = useCallback((event: RowDoubleClickedEvent<Recording>) =>
          onOpenRecording(event.data),
      [onOpenRecording]);

  const onRowSelected = useCallback((event: RowSelectedEvent<Recording>) =>
          setSelectedRecording(event.data),
    [setSelectedRecording]);

  const onSelectionChanged = useCallback((event: SelectionChangedEvent<Recording>) =>
          setSelectedRecording(event.api.getSelectedNodes()?.at(0)?.data),
    [setSelectedRecording]);

  const onRefreshRecordings = () => {
    const now = new Date();

    for(let index = 0; index < 5; ++index) {
      const finishTimestamp = new Date(now.getTime() + (index * 3600000));
      const startTimestamp = new Date(finishTimestamp.getTime() - 3600000);
      const sessionId = startTimestamp.toISOString();

      recordings.push(
        { instituteId: 'neuroservo', patientId: 'sbelbin', sessionId: sessionId, startTimestamp: startTimestamp, finishTimestamp: undefined, localTimeZone: 'America/Toronto', isLiveFeed: true },
      );
    };

    window.alert('Refreshing the recording sessions.');

    gridRef.current!.api.setGridOption('rowData', recordings);
  };

  return (
    <Container>
      <Stack>
        <Row>
          <Col md={{ span: 1, offset: 0 }} >
            <Button
              onClick={() => onOpenRecording(selectedRecording)}
              disabled={!selectedRecording}
            >
              Open
            </Button>
          </Col>
          <Col md={{ span: 0, offset: 9 }} >
            <Button
              onClick={() => onRefreshRecordings()}
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
            width: 850,
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
            rowData={recordings}
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
