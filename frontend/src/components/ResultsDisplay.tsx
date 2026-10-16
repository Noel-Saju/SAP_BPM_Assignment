interface Props {
  data: unknown;
}

const ResultsDisplay = ({ data }: Props) => {
  return (
    <div className="results">
      <h2>Analysis Results</h2>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
};

export default ResultsDisplay;
