import { ModifierMouseArgs, SvgAnnotationBase } from 'scichart';

import {
  ChartModifierBase2D,
  IChartModifierBaseOptions
} from 'scichart/Charting/ChartModifiers/ChartModifierBase2D';

import { DpiHelper} from 'scichart/Charting/Visuals/TextureManager/DpiHelper';

/**
 * This class provides tooltip capabilities on annotations displayed within the chart view.
 *
 * @remarks
 *   As a user hovers over the annotation in the chart view, a tooltip appears presenting the
 *   user with the details associated to that annotation.
 */
export class AnnotationTooltipModifier extends ChartModifierBase2D {
  readonly type = 'AnnotationTooltipChartModifier';

  constructor(options?: IChartModifierBaseOptions) {
    super(options);
  }

  /**
   * Callback that is invoked when there is mouse movements within the chart's view.
   *
   * @todo
   *   This isn't fully functional at this point, since it requires refinement as to display a
   *   tooltip within the chart view.
   *
   * @todo
   *   Eventually when a the session page presents annotations in a side-panel then as users hover
   *   hover over an annotation that annotation would be highlight or focused and possibly a
   *   double-click would open the annotation's complete details in a pop-up dialog (to edit?)
  */
  modifierMouseMove(args: ModifierMouseArgs) {
    super.modifierMouseMove(args);

    const x = args.mousePoint.x / DpiHelper.PIXEL_RATIO;
    const y = args.mousePoint.y / DpiHelper.PIXEL_RATIO;

    for (let index = 0; index < this.parentSurface.annotations.size(); ++index) {
      const annotation = this.parentSurface.annotations.get(index);

      if (!(annotation.checkIsClickedOnAnnotation(x, y) &&
            annotation instanceof SvgAnnotationBase)) continue;

      // const svgAnnotation = annotation as SvgAnnotationBase;

      // const svgDetails =
      //         `<svg viewBox="0 0 240 80" xmlns="http://www.w3.org/2000/svg">
      //           <style>
      //             .regular {
      //               font: italic 18px sans-serif;
      //             }
      //           </style>
      //           <text x="20" y="35" class="regular">hello</text>
      //         </svg>`;

      // svgAnnotation.svg( ) .setSvg(svgDetails);

      console.log(`Showing tooltip for the annotation at location of ${annotation.x1}.`);
      break;
    }
  }
}