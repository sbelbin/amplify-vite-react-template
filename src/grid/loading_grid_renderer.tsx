import { CustomLoadingCellRendererProps } from 'ag-grid-react';

/**
 * Provides a visual feedback to users when rows are being loaded into a grid.
 *
 * @param props - AG Grid custom loading cell renderer properties.
 *                Optionally a customized text message can be provided.
 * @returns An JSX.Element to display within the grid.
 * @remarks See https://www.ag-grid.com/react-data-grid/component-loading-cell-renderer/
 *          for an example on how to set this up. This is practical on infinite scroll
 *          or when enabling server-side rendering.
 */
function loadingGridRenderer(props: CustomLoadingCellRendererProps & { loadingMessage: string | undefined | null }) {
  return (
    <div className="ag-custom-loading-cell" style={{ paddingLeft: '10px', lineHeight: '25px' }}>
      <i className="fas fa-spinner fa-pulse"/>
      <span> {props.loadingMessage ?? ''} </span>
    </div>
  );
};

export default loadingGridRenderer;
