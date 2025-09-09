import React, { useRef } from "react";
import html2pdf from "html2pdf.js";
import "./InvoiceBill.css";

const InvoiceBill = ({ invoiceData }) => {
  const invoiceRef = useRef();

  const {
    companyName,
    companyAddress,
    companyEmail,
    gstIn,
    companyOfficeNumber,
    companyMobileNumber,
    lorryNumber,
    date,
    vehicleName,
    ownerName,
    consignorName,
    consignorAddress,
    consigneeName,
    consigneeAddress,
    customerName,
    customerAddress,
    startLocation,
    endLocation,
    containerNumber,
    sealNumber,
    itemName,
    itemQuantity,
    itemUnit,
    itemWeight,
    itemcost,
    customerRate,
    customerFreight,
    transporterRate,
    totalTransporterAmount,
    transporterRateOn,
    customerRateOn,
    transporterFreight,
    driverName,
  } = invoiceData || {};

  const handleDownloadPDF = () => {
    const element = invoiceRef.current.cloneNode(true);
    const footer = element.querySelector(".invoice-footer");
    if (footer) footer.remove();

    element.style.padding = "30px";
    element.style.backgroundColor = "white";

    const opt = {
      margin: 0,
      filename: `Invoice-${lorryNumber || "Bill"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: {
        scale: 3,
        useCORS: true,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 1400,
      },
      jsPDF: {
        unit: "mm",
        format: "a4",
        orientation: "portrait",
      },
      pagebreak: {
        avoid: [".signature-section"],
        mode: ["avoid-all", "css", "legacy"],
      },
    };

    html2pdf().set(opt).from(element).save();
  };

  return (
    <div className="invoice-wrapper">
      <div className="invoice" ref={invoiceRef}>
        {/* Header */}
        <div className="invoice-header">
          <div className="company-logo-name">
            <div>
              <h1>{companyName || "Company Name"}</h1>
              <p>{companyAddress || "Company Address"}</p>
            </div>
          </div>
          <div className="header-right">
            <p>
              <strong>GSTIN:</strong> {gstIn || "N/A"}
            </p>
            <p>
              <strong>Email:</strong> {companyEmail || "N/A"}
            </p>
            <p>
              <strong>Office:</strong> {companyOfficeNumber || "N/A"}
            </p>
            <p>
              <strong>Mobile:</strong> {companyMobileNumber || "N/A"}
            </p>
          </div>
        </div>

        {/* Vehicle & Route */}
        <div className="section two-column">
          <div className="cardtitle">
            <h3>Vehicle Details</h3>
            <div className="details-row">
              <p>
                <strong>Lorry Number:</strong> {lorryNumber || "N/A"}
              </p>
              <p>
                <strong>Date:</strong> {date || "N/A"}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Vehicle:</strong> {vehicleName || "N/A"}
              </p>
              <p>
                <strong>Owner:</strong> {ownerName || "N/A"}
              </p>
            </div>
          </div>
          <div className="cardtitle">
            <h3>Route Details</h3>
            <div className="details-row">
              <p>
                <strong>Destination:</strong> {startLocation || "N/A"} →{" "}
                {endLocation || "N/A"}
              </p>
              <p>
                <strong>Container No.:</strong> {containerNumber || "N/A"}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Seal No.:</strong> {sealNumber || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Consignor & Consignee */}
        <div className="section two-column">
          <div className="cardtitle">
            <h3>Consignor Details</h3>
            <div className="details-row">
              <p>
                <strong>Name:</strong> {consignorName || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {consignorAddress || "N/A"}
              </p>
            </div>
          </div>
          <div className="cardtitle">
            <h3>Consignee Details</h3>
            <div className="details-row">
              <p>
                <strong>Name:</strong> {consigneeName || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {consigneeAddress || "N/A"}
              </p>
            </div>
          </div>
        </div>

        {/* Items */}
        <div className="section">
          <h3>Item Details</h3>
          <table className="item-table">
            <thead>
              <tr>
                <th>Item Name</th>
                <th>Quantity</th>
                <th>Unit</th>
                <th>Weight (kg)</th>
                <th>Cost (₹)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{itemName || "N/A"}</td>
                <td>{itemQuantity || "N/A"}</td>
                <td>{itemUnit || "N/A"}</td>
                <td>{itemWeight || "N/A"}</td>
                <td>₹{itemcost?.toLocaleString() || 0}</td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Customer & Transporter */}
        <div className="section two-column">
          <div className="cardtitle">
            <h3>Customer Details</h3>
            <div className="details-row">
              <p>
                <strong>Name:</strong> {customerName || "N/A"}
              </p>
              <p>
                <strong>Address:</strong> {customerAddress || "N/A"}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Customer Rate On:</strong> {customerRateOn || "N/A"}
              </p>
              <p>
                <strong>Customer Rate:</strong> ₹{customerRate || 0}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Customer Freight:</strong> ₹
                {customerFreight?.toLocaleString() || 0}
              </p>
            </div>
          </div>
          <div className="cardtitle">
            <h3>Transporter Details</h3>
            <div className="details-row">
              <p>
                <strong>Driver Name:</strong> {driverName || "N/A"}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Transporter Rate On:</strong>{" "}
                {transporterRateOn || "N/A"}
              </p>
              <p>
                <strong>Transporter Rate:</strong> ₹{transporterRate || 0}
              </p>
            </div>
            <div className="details-row">
              <p>
                <strong>Transporter Freight:</strong> ₹
                {transporterFreight?.toLocaleString() || 0}
              </p>
              <p>
                <strong>Total Amount:</strong> ₹
                {totalTransporterAmount?.toLocaleString() || 0}
              </p>
            </div>
          </div>
        </div>

        {/* Terms & Signature */}
        <div className="invoice-page">
          <h3>Terms & Conditions</h3>
          <ul>
            <li>
              Goods are transported at the owner's risk unless otherwise
              specified.
            </li>
            <li>
              Transporter is not liable for damages caused by natural calamities
              or accidents.
            </li>
            <li>
              Delivery will be made only upon presentation of the original lorry
              receipt.
            </li>
          </ul>
          <div className="signature-section">
            <p>
              <strong>Authorized Signatory (Transporter):</strong> ____________
            </p>
            <p>Consignor: ____________</p>
            <p>Consignee: ____________</p>
          </div>
        </div>

        {/* Footer */}
        <div className="invoice-footer">
          <p className="stamp">[Transport Company Stamp]</p>
          <button className="download-btn" onClick={handleDownloadPDF}>
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
};

export default InvoiceBill;
