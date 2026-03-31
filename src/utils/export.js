export function exportResults(data, filenamePrefix = 'Anchor') {
    const exportData = {
        exportDate: new Date().toISOString(),
        application: 'Anchor ADHD Assessment Platform',
        disclaimer: 'This is a screening instrument only. It does not provide a clinical diagnosis.',
        data: data
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const filename = `${filenamePrefix}_${new Date().toISOString().split('T')[0]}.json`;

    const link = document.createElement('a');
    link.setAttribute('href', dataUri);
    link.setAttribute('download', filename);
    link.click();
}
