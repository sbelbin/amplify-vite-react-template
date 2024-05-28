import type { Schema } from '../../../amplify/data/resource';

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

import { generateClient } from 'aws-amplify/data';

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

/**
 * Returns a textual representation of a duration that covers days/hours/minutes/seconds.
 *
 * @param from - The starting point-in-time.
 * @param until - The finishing point-in-time. When it's unknown then assume now.
 * @returns A textual representation.
 *
 * @remarks
 * When the duration is in days or hours, then minutes & seconds are zero padded.
 * When the duration is in minutes, then seconds is padded.
 * When the duration is in seconds, then seconds are displayed.
 */
function formatDuration(from: Date, until: Date | undefined | null): string {
  let remainder = (until?.getTime() ?? Date.now()) - from.getTime();

  const SECOND = 1000;
  const MINUTE = 60 * SECOND;
  const HOUR = 60 * MINUTE;
  const DAY = 24 * HOUR;

  const days = Math.floor(remainder / DAY);
  remainder -= days * DAY;

  const hours = Math.floor(remainder / HOUR);
  remainder -= hours * HOUR;

  const minutes = Math.floor(remainder / MINUTE);
  remainder -= minutes * MINUTE;

  const seconds = Math.floor(remainder / SECOND);

  return days    ? `${days} ${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
       : hours   ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
       : minutes ? `${minutes}:${seconds.toString().padStart(2, '0')}`
       : `${seconds} seconds`
}

function SessionsSelectPage(props: PageProperties) {
  const navigate = useNavigate();

  useEffect(() => {{
    !props.isUserLoggedIn() && navigate('/');
  }}, []);

  const client = generateClient<Schema>();

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

  const durationCellRenderer = (params: CustomCellRendererProps<Recording, Number>) => (
    params.node.data && formatDuration(params.node.data.startTimestamp, params.node.data.finishTimestamp)
  );

  const [recordings, setRecordings] = useState<Recording[]>([]);

  const fetchRecordings = async () => {
    const now = new Date(Date.now());

    const { errors, data: item } = await client.models.recordings.create({
      instituteId: 'neuroservo',
      sessionId: now.toISOString(),
      patientId: 'sbelbin',
      startTimestamp: now.toISOString(),
      localTimeZone: 'America/Toronto'
    });

    if (errors) {
      console.error(`Failed to add an item to the recording sessions table. Reason(s): ${errors}`);
      return;
    }

    if (!item) {
      console.error('Failed to add an item to the recording sessions table.');
      return;
    }

    const recording: Recording = {
      instituteId: item!.instituteId,
      sessionId: item!.sessionId,
      patientId: item!.patientId,
      startTimestamp: new Date(Date.parse(item!.startTimestamp)),
      finishTimestamp: (item!.finishTimestamp !== null && item!.finishTimestamp !== undefined) ? new Date(Date.parse(item!.startTimestamp)) : undefined,
      localTimeZone: item!.localTimeZone,
      isLiveFeed: (item!.finishTimestamp === null || item!.finishTimestamp === undefined),
    };

    recordings.push(recording);

    setRecordings(recordings);
    gridRef.current!.api.setGridOption('rowData', recordings);

    // client.models.recordings.list()
    // .then((result) => {

    //   if (result.errors) {
    //     console.error(`Failed to fetch the recording sessions from the table. Reason(s): ${result.errors}`);
    //     return;
    //   }

    //   const recordings: Recording[] = result.data.map((recording) => ({
    //     instituteId: recording.instituteId,
    //     sessionId: recording.sessionId,
    //     patientId: recording.patientId,
    //     startTimestamp: new Date(Date.parse(recording.startTimestamp)),
    //     finishTimestamp: (recording.finishTimestamp !== null && recording.finishTimestamp !== undefined) ? new Date(Date.parse(recording.startTimestamp)) : undefined,
    //     localTimeZone: recording.localTimeZone,
    //     isLiveFeed: (recording.finishTimestamp === null || recording.finishTimestamp === undefined),
    //   }));

    //   setRecordings(recordings);
    //   gridRef.current!.api.setGridOption('rowData', recordings);
    // })
    // .catch((error) => {
    //   console.error(`Failed to fetch the recording sessions from the table. Reason(s): ${error}`);
    // });
  };

  useEffect(() => {
      fetchRecordings();
    },
    []);

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
      comparator: (lhs: Date | undefined | null, rhs: Date | undefined | null) => {
        return (lhs === rhs) ? 0
             : (lhs === undefined || lhs === null) ? 1
             : (rhs === undefined || rhs === null) ? -1
             : (lhs > rhs) ? 1
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
    fetchRecordings();
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
            width: 1025,
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
