type TodayLineProps = {
  /** The resolved sentence — analyst voice, lowercase, period or em-dash terminator. */
  sentence: string;
};

/**
 * The single italic serif sentence between the Room nav and page
 * content. Computed server-side per request — this component only
 * renders the resolved string.
 */
export default function TodayLine({ sentence }: TodayLineProps) {
  return (
    <div className="today-line-wrap">
      <p className="today-line">{sentence}</p>
    </div>
  );
}
