const A4_WIDTH_PX = 794
const A4_HEIGHT_PX = Math.floor((A4_WIDTH_PX * 297) / 210) // 1122 — floor: a page must map back to ≤ 297mm, else every PDF gains a blank trailing page

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

        // v2 documents mark the seller footer with #doc-footer: extend the body to a whole
        // number of A4 pages and pin the footer to the bottom of the last page, keeping the
        // document cell's 48px bottom / 40px side padding. v1 documents have no marker and
        // keep the content-height snapshot unchanged.
        const footer = iframe.contentDocument.getElementById('doc-footer')
        if (footer) {
            const pages = Math.ceil(body.scrollHeight / A4_HEIGHT_PX)
            body.style.position = 'relative'
            body.style.height = `${pages * A4_HEIGHT_PX}px`
            footer.style.position = 'absolute'
            footer.style.left = '40px'
            footer.style.right = '40px'
            footer.style.bottom = '48px'
        }

        iframe.style.height = `${body.scrollHeight}px`

        const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
            import('html2canvas'),
            import('jspdf'),
        ])

        // height/windowHeight pinned to the body box so the canvas can never inherit
        // the iframe viewport height instead
        const canvas = await html2canvas(body, {
            scale: 2,
            backgroundColor: '#ffffff',
            height: body.scrollHeight,
            windowHeight: body.scrollHeight,
        })
        const pdf = new jsPDF({ unit: 'mm', format: 'a4' })
        const pageWidth = pdf.internal.pageSize.getWidth()
        const pageHeight = pdf.internal.pageSize.getHeight()
        const imgHeight = (canvas.height * pageWidth) / canvas.width
        const image = canvas.toDataURL('image/png')

        if (imgHeight > pageHeight) {
            // taller than one page: scale down uniformly to fit — never paginate
            pdf.addImage(image, 'PNG', 0, 0, (pageWidth * pageHeight) / imgHeight, pageHeight)
        } else {
            pdf.addImage(image, 'PNG', 0, 0, pageWidth, imgHeight)
        }

        pdf.save(filename)
    } finally {
        iframe.remove()
    }
}
