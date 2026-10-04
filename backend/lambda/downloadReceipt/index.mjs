// Ported 1:1 from base44/functions/downloadReceipt/entry.ts
import { jsPDF } from 'jspdf';
import { GetCommand } from '@aws-sdk/lib-dynamodb';
import { ddb, TABLES, json, getUserFromEvent } from '../_lib/common.mjs';

// Fallback prices only (Apple purchases don't record an amount); Stripe payments
// carry their own amount. Current list prices, see createCheckoutSession.
const PACKAGE_PRICES = { Basic: 2.99, Standard: 6.99, Premium: 14.99 };
const BIKE_PACKAGE_PRICES = { Basic: 0.99, Standard: 1.99, Premium: 2.99 };
const BIKE_SUBSECTIONS = ['Bikes & Bicycles', 'Car Extras', 'Car Parts', 'Boat Extras', 'Other items', 'Motorbike Extras'];

// `entry` is one item of the ad's paymentHistory (a renewed ad has several); ads
// paid before payment history existed fall back to the ad's own fields.
function getPaymentAmount(ad, entry) {
  if (entry?.amount != null) return entry.amount / 100;
  if (ad.paymentAmount != null) return ad.paymentAmount / 100;
  const isBike = BIKE_SUBSECTIONS.includes(ad.subsection);
  const prices = isBike ? BIKE_PACKAGE_PRICES : PACKAGE_PRICES;
  return prices[entry?.packageName || ad.packageName] || 0;
}

export const handler = async (event) => {
  try {
    const user = await getUserFromEvent(event);
    if (!user) return json(401, { error: 'Unauthorized' });

    const { adId, paymentIndex } = JSON.parse(event.body || '{}');
    if (!adId) return json(400, { error: 'Missing adId' });

    const adRes = await ddb.send(new GetCommand({ TableName: TABLES.UserAd, Key: { id: adId } }));
    const ad = adRes.Item;
    if (!ad) return json(404, { error: 'Ad not found' });
    if (ad.created_by_id !== user.id) return json(403, { error: 'Forbidden' });

    const entry = Number.isInteger(paymentIndex) ? ad.paymentHistory?.[paymentIndex] : undefined;
    const amount = getPaymentAmount(ad, entry);
    const receiptDate = entry?.date || ad.created_date;
    const dateStr = receiptDate ? new Date(receiptDate).toLocaleDateString('en-IE') : 'N/A';
    const receiptId = `RCPT-${ad.id.slice(-8).toUpperCase()}${entry ? `-${paymentIndex + 1}` : ''}`;
    const paidPackage = entry?.packageName || ad.packageName;

    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setFont('helvetica', 'bold');
    doc.text('AutoMax', 20, 25);
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text("Ireland's Largest Car Marketplace", 20, 32);

    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('RECEIPT', 20, 50);
    doc.setDrawColor(200);
    doc.line(20, 55, 190, 55);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt No: ${receiptId}`, 20, 65);
    doc.text(`Date: ${dateStr}`, 20, 72);
    doc.text('Payment Method: Credit / Debit Card', 20, 79);

    // Trader ads carry the business details entered on Place Ad / Edit Ad; the receipt shows
    // them under "Billed To" for the trader's records.
    const business = ad.isTrader && ad.businessName
      ? { name: ad.businessName, address: ad.businessAddress, vat: ad.vatNumber }
      : null;
    doc.setFont('helvetica', 'bold');
    doc.text('Billed To:', 20, 95);
    doc.setFont('helvetica', 'normal');
    let billedY = 102;
    const billedLine = (text) => {
      doc.text(String(text).slice(0, 90), 20, billedY);
      billedY += 7;
    };
    if (business) {
      billedLine(business.name);
      String(business.address || '').split(/\r?\n/).map((l) => l.trim()).filter(Boolean).slice(0, 4).forEach(billedLine);
      if (business.vat) billedLine(`VAT No: ${business.vat}`);
    }
    billedLine(user.full_name || user.email || 'Valued Customer');
    if (user.email) billedLine(user.email);

    const tableY = Math.max(125, billedY + 10);
    doc.setFont('helvetica', 'bold');
    doc.text('Description', 20, tableY);
    doc.text('Amount', 160, tableY);
    doc.line(20, tableY + 3, 190, tableY + 3);

    doc.setFont('helvetica', 'normal');
    const packageName = paidPackage ? `${paidPackage} Ad Package` : 'Ad Listing';
    doc.text(packageName, 20, tableY + 13);
    doc.text(`EUR ${amount.toFixed(2)}`, 160, tableY + 13);

    if (ad.title) {
      doc.setFontSize(9);
      doc.setTextColor(100);
      doc.text(`Listing: ${ad.title}`, 20, tableY + 20);
      doc.setTextColor(0);
      doc.setFontSize(10);
    }

    doc.line(20, tableY + 30, 190, tableY + 30);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Paid:', 120, tableY + 38);
    doc.text(`EUR ${amount.toFixed(2)}`, 160, tableY + 38);

    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(120);
    doc.text('Thank you for your payment. This receipt was issued electronically by AutoMax.', 20, tableY + 60);
    doc.text('For questions about this transaction, contact support@automax.ie', 20, tableY + 66);

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="automax-receipt-${receiptId}.pdf"`,
        'Access-Control-Allow-Origin': '*',
      },
      isBase64Encoded: true,
      body: pdfBuffer.toString('base64'),
    };
  } catch (error) {
    console.error('downloadReceipt error:', error);
    return json(500, { error: error.message });
  }
};
