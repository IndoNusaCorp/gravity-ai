import fs from 'fs';
import path from 'path';
const PDFParser = require('pdf2json');

const dataset = [
    '2+Twinda+11-16.pdf',
    '11. 2022-12 Scopus Q1 Penulis Pendamping P1 Korres.pdf',
    '955-Article Text-6620-8423-10-20260212.pdf',
    'adebani,+Sostech+-+I+Wayan+Sadwika.pdf',
    'Artificial+Intelligence+Adoption+and+Implementation+In+Indonesia+Policy+Frameworks+Sectoral+Applications+and+Future+Prospects.pdf',
    'jie-19034-Article+Text-52385-ED.pdf',
    'Rakuasa.pdf',
    'Tri+Kusumastuti+363-380.pdf'

]

function connectingDataset(fileName: string) {
    const filePath = path.join(process.cwd(), 'src', 'app', 'dataset', fileName);
    if (fs.existsSync(filePath)) {
        console.log(`✅ File terkoneksi: ${fileName}`);
    } else {
        console.log(`❌ File TIDAK ditemukan: ${fileName}`);
    }
}

async function readPdfContent(fileName: string): Promise<string> {
    return new Promise((resolve, reject) => {
        const filePath = path.join(process.cwd(), 'src', 'app', 'dataset', fileName);
        
        if (!fs.existsSync(filePath)) {
            return reject(new Error(`File ${fileName} tidak ditemukan di folder dataset!`));
        }

        const pdfParser = new PDFParser(null, 1);
        
        pdfParser.on("pdfParser_dataError", (errData: any) => reject(errData.parserError));
        pdfParser.on("pdfParser_dataReady", () => {
            resolve(pdfParser.getRawTextContent());
        });

        pdfParser.loadPDF(filePath);
    });
}

export { dataset, connectingDataset, readPdfContent };