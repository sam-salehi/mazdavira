function ExtractionDisplay({ count }: { count: number }) {
    // Display of server-side extraction in callBFS on screen
    // FIXME: set to work with count alone
    const hiddenNodes = 4
    // TODO add display nodes button.

    return (
        <div className="bg-gray absolute z-20 left-0 top-0 h-fit w-1/4 p-7">
            <h1 className="opacity-60" style={{ color: 'rgb(0, 255, 255)' }}>Extraction count: {count}</h1>
            <h1 className="opacity-60" style={{ color: 'rgb(0, 255, 255)' }}>Hidden nodes: {hiddenNodes}</h1>
        </div>
    );

    return null; // Return null if count is not present
}

export default ExtractionDisplay;