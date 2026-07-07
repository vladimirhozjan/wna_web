const A4_WIDTH_PX = 794

// sandbox without allow-scripts — backend HTML must never execute script in the app;
// allow-same-origin only lets us read the rendered DOM for the snapshot
function renderInFrame(html) {
    return new Promise((resolve) => {
        const iframe = document.createElement('iframe')
        iframe.setAttribute('sandbox', 'allow-same-origin')
        iframe.style.position = 'fixed'
        iframe.style.left = '-10000px'
        iframe.style.top = '0'
        iframe.style.width = `${A4_WIDTH_PX}px`
        iframe.style.border = '0'
        iframe.onload = () => resolve(iframe)
        iframe.srcdoc = html
        document.body.appendChild(iframe)
    })
}

export async function downloadDocumentPdf(html, filename) {
    const iframe = await renderInFrame(html)
    try {
        const body = iframe.contentDocument.body
        iframe.style.height = `${body.scrollHeight + 40}px`

        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
            import('html2canvas'),
            import('jspdf'),
        ])

        const canvas = await html2canvas(body, { scale: 2, backgroundColor: '#ffffff' })
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const imgHeight = (canvas.height * pageWidth) / canvas.width
        const image = canvas.toDataURL('image/png')

        pdf.addImage(image, 'PNG', 0, 0, pageWidth, imgHeight)
        let rendered = pageHeight
        while (rendered < imgHeight) {
            pdf.addPage()
            pdf.addImage(image, 'PNG', 0, -rendered, pageWidth, imgHeight)
            rendered += pageHeight
        }

        pdf.save(filename)
    } finally {
        iframe.remove()
    }
}
