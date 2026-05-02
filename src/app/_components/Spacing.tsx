export const Spacing = ({ height }: { height: number }): React.ReactNode => {
  //
  return <div style={{height: `${height}rem`, width: '100%'}} data-test="spacing-div" ></div>;
};
