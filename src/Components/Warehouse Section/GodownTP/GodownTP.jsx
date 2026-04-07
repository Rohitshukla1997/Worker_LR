import React, { useEffect, useState } from "react";
import { getGodownTPApi, postGodownTPApi } from "../data/data";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast, ToastContainer } from "react-toastify";
import DateRangeFilterCredence from "../../ReusableComponents/DateRangeFilterCredence";
import SingleSelectDropdown from "../../ReusableComponents/SingleSelectDropdown";
import SearchInput from "../../ReusableComponents/SearchInput";
import TableArray from "../../ReusableComponents/TableArray";
import SmartPagination from "../../ReusableComponents/SmartPagination";
import { FaExchangeAlt, FaEye, FaWarehouse, FaFilter } from "react-icons/fa";
// Import the form components
import WarehouseForm from "./component/WarehouseForm";
import WarehouseToPartyForm from "./component/WarehouseToPartyForm";
import TpInvoiceBill from "./component/TpInvoiceBill";
import {
  getCompanyNameApi,
  getDigitalSignatureApi,
} from "../../TransportPass/data/data";

const GodownLr = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");

  // Date range state
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  // for supervisor select
  const [selectedName, setSelectedName] = useState(null);

  // for worker select
  const [selectedWorker, setSelectedWorker] = useState(null);

  // for consignor select
  const [selectedConsignor, setSelectedConsignor] = useState(null);

  // for consignee select
  const [selectedConsignee, setSelectedConsignee] = useState(null);

  // for company select
  const [selectedCompany, setSelectedCompany] = useState(null);

  // Add status filter state
  const [selectedStatus, setSelectedStatus] = useState("All");

  // Modal states
  const [showFormSelection, setShowFormSelection] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [selectedData, setSelectedData] = useState(null);
  const [selectedFormType, setSelectedFormType] = useState(null);

  // Image modal state
  const [showImageModal, setShowImageModal] = useState(false);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);

  // Consignor and consignee options state
  const [consignorOptions, setConsignorOptions] = useState([]);
  const [consigneeOptions, setConsigneeOptions] = useState([]);
  const [companyOptions, setCompanyOptions] = useState([]);

  const queryClient = useQueryClient();

  // Add these state variables near other state variables
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [selectedInvoiceData, setSelectedInvoiceData] = useState(null);

  // Define status options
  const statusOptions = [
    { value: "All", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Completed", label: "Completed" },
    { value: "Cancelled", label: "Cancelled" },
    { value: "Partially Correction", label: "Partially Correction" },
  ];

  // Helper function to detect form type from record
  const detectFormType = (record) => {
    if (!record) return "warehouse";

    // Check tpPassType first
    if (record.tpPassType) {
      if (record.tpPassType === "warehouseToParty") {
        return "warehouseToParty";
      }
      if (record.tpPassType === "warehouse") {
        return "warehouse";
      }
    }

    // Fallback detection based on fields
    if (record.issuedBy === "Warehouse" && record.receivedBy === "Party") {
      return "warehouseToParty";
    }

    if (record.issuedBy === "Railhead") {
      return "warehouse";
    }

    // Default fallback to warehouse
    return "warehouse";
  };

  // Fetch godown lorry receipts with all filters
  const { data: getGodownTP, isFetching } = useQuery({
    queryKey: [
      "getGodownTP",
      {
        search: searchQuery,
        page: currentPage,
        limit: itemsPerPage,
        consignorId: selectedConsignor?.value || null,
        consigneeId: selectedConsignee?.value || null,
        companyId: selectedCompany?.value || null,
        status: selectedStatus !== "All" ? selectedStatus : null,
      },
    ],
    queryFn: getGodownTPApi,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 30,
    cacheTime: 1000 * 60 * 10,
  });

  // company fetch
  const { data: companyList = [] } = useQuery({
    queryKey: ["companyList"],
    queryFn: getCompanyNameApi,
  });

  // Extract company options
  useEffect(() => {
    if (companyList && Array.isArray(companyList)) {
      const companies = companyList.map((company) => ({
        value: company.id || company._id,
        label: company.companyName || company.name || "Unknown Company",
      }));
      setCompanyOptions(companies);
    }
  }, [companyList]);

  // Extract consignor and consignee options from fetched data
  useEffect(() => {
    if (getGodownTP?.receipts) {
      const consignorsMap = {};
      const consigneesMap = {};

      getGodownTP.receipts.forEach((item) => {
        // Add consignor
        if (item.consignorId && item.consignorName) {
          consignorsMap[item.consignorId] = {
            value: item.consignorId,
            label: item.consignorName,
          };
        }

        // Add consignee
        if (item.consigneeId && item.consigneeName) {
          consigneesMap[item.consigneeId] = {
            value: item.consigneeId,
            label: item.consigneeName,
          };
        }
      });

      setConsignorOptions(Object.values(consignorsMap));
      setConsigneeOptions(Object.values(consigneesMap));
    }
  }, [getGodownTP]);

  // ========== POST ==========
  const { mutate: postGodownTP, isLoading: isSubmitting } = useMutation({
    mutationFn: postGodownTPApi,
    onSuccess: () => {
      toast.success("Lorry receipt added successfully!");
      queryClient.invalidateQueries({ queryKey: ["getGodownTP"] });
      setSelectedFormType(null);
    },
    onError: (error) => toast.error(error.message),
  });

  // Handle form submission
  const handleFormSubmit = (formData) => {
    if (formMode === "add") {
      postGodownTP(formData);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (startDate, endDate) => {
    setDateRange({ startDate, endDate });
    setCurrentPage(1);
  };

  // Clear all filters
  const clearAllFilters = () => {
    setSelectedConsignor(null);
    setSelectedConsignee(null);
    setSelectedCompany(null);
    setSelectedName(null);
    setSelectedWorker(null);
    setSelectedStatus("All");
    setDateRange({ startDate: null, endDate: null });
    setSearchQuery("");
    setCurrentPage(1);
    toast.info("All filters cleared");
  };

  // Handle status button click
  const handleStatusFilterClick = (status) => {
    setSelectedStatus(status);
    setCurrentPage(1);
  };

  // Update filtered data when API data changes
  useEffect(() => {
    if (getGodownTP?.receipts) {
      let filtered = [...getGodownTP.receipts];

      // Filter by date range if selected
      if (dateRange.startDate && dateRange.endDate) {
        filtered = filtered.filter((item) => {
          const itemDate = new Date(item.originalDate);
          return (
            itemDate >= new Date(dateRange.startDate) &&
            itemDate <= new Date(dateRange.endDate)
          );
        });
      }

      // Filter by workerId
      if (selectedWorker?.value) {
        filtered = filtered.filter((receipt) => {
          return (
            receipt.workerId === selectedWorker.value ||
            receipt.worker_id === selectedWorker.value ||
            receipt.worker === selectedWorker.value
          );
        });
      }

      // Filter by consignor
      if (selectedConsignor?.value) {
        filtered = filtered.filter((receipt) => {
          return receipt.consignorId === selectedConsignor.value;
        });
      }

      // Filter by consignee
      if (selectedConsignee?.value) {
        filtered = filtered.filter((receipt) => {
          return receipt.consigneeId === selectedConsignee.value;
        });
      }

      // Filter by company
      if (selectedCompany?.value) {
        filtered = filtered.filter((receipt) => {
          return receipt.companyId === selectedCompany.value;
        });
      }

      // Filter by status (client-side fallback if API doesn't support it)
      if (selectedStatus !== "All") {
        filtered = filtered.filter((receipt) => {
          return receipt.status === selectedStatus;
        });
      }

      setFilteredData(filtered);
    }
  }, [
    getGodownTP,
    dateRange,
    selectedName,
    selectedWorker,
    selectedConsignor,
    selectedConsignee,
    selectedCompany,
    selectedStatus,
  ]);

  // Compute total pages
  const totalPages = getGodownTP
    ? Math.ceil(getGodownTP.total / getGodownTP.limit)
    : 1;

  // status colour
  const getStatusStyle = (status) => {
    return {
      display: "inline-block",
      minWidth: "70px",
      padding: "1px 8px",
      borderRadius: "10px",
      textAlign: "center",
      textTransform: "capitalize",
      fontWeight: "400",
      backgroundColor:
        status === "Pending"
          ? "#f5a623"
          : status === "Completed"
            ? "#28a745"
            : status === "Cancelled"
              ? "#dc3545"
              : status === "Partially Correction"
                ? "#007bff"
                : "#6c757d",
      color: "white",
    };
  };

  // Status button style
  const getStatusButtonStyle = (status) => {
    const isActive = selectedStatus === status;

    const baseStyle = {
      padding: "4px 12px",
      borderRadius: "20px",
      border: "1px solid #dee2e6",
      fontSize: "14px",
      fontWeight: "400",
      cursor: "pointer",
      transition: "all 0.2s ease",
      whiteSpace: "nowrap",
    };

    if (isActive) {
      return {
        ...baseStyle,
        backgroundColor:
          status === "All"
            ? "#6c757d"
            : status === "Pending"
              ? "#f5a623"
              : status === "Completed"
                ? "#28a745"
                : status === "Cancelled"
                  ? "#dc3545"
                  : "#007bff",
        color: "white",
        borderColor:
          status === "All"
            ? "#6c757d"
            : status === "Pending"
              ? "#f5a623"
              : status === "Completed"
                ? "#28a745"
                : status === "Cancelled"
                  ? "#dc3545"
                  : "#007bff",
      };
    }

    return {
      ...baseStyle,
      backgroundColor: "white",
      color:
        status === "All"
          ? "#6c757d"
          : status === "Pending"
            ? "#f5a623"
            : status === "Completed"
              ? "#28a745"
              : status === "Cancelled"
                ? "#dc3545"
                : "#007bff",
      ":hover": {
        backgroundColor: "#f8f9fa",
      },
    };
  };

  // Add a render function for image preview in table
  const renderImagePreview = (item) => {
    if (!item.acknowledgementImage) {
      return <span className="text-gray-500">No Image</span>;
    }

    const fullImageUrl = `${import.meta.env.VITE_API_URL}${
      item.acknowledgementImage
    }`;

    return (
      <div className="flex justify-center">
        <button
          onClick={(e) => {
            e.stopPropagation();
            setSelectedImageUrl(fullImageUrl);
            setShowImageModal(true);
          }}
          className="flex items-center gap-2 px-3 py-1 text-sm bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white rounded hover:opacity-90 transition-all duration-200 shadow-sm hover:shadow-md"
        >
          <FaEye className="text-white" /> View Image
        </button>
      </div>
    );
  };

  // Frontend table columns
  const frontendColumns = [
    {
      label: "Date",
      key: "date",
      sortable: true,
    },
    { label: "Recipt No", key: "receiptNo", sortable: true },
    { label: "Company Name", key: "companyName", sortable: true },
    { label: "Consignor Name", key: "consignorName", sortable: true },
    { label: "Consignee Name", key: "consigneeName", sortable: true },
    { label: "Material Owner", key: "materialOwner", sortable: true },
    { label: "Vehicle Name", key: "vehicleName", sortable: true },
    { label: "Driver Name", key: "driverName", sortable: true },
    {
      label: "Acknowledgement",
      key: "acknowledgementImage",
      render: renderImagePreview,
    },
    {
      label: "Status",
      key: "status",
      render: (row) => (
        <span style={getStatusStyle(row.status)}>{row.status}</span>
      ),
    },
  ];

  // Handle Add button click - show type selection
  const handleAddButtonClick = () => {
    setFormMode("add");
    setSelectedData(null);
    setSelectedFormType(null);
    setShowFormSelection(true);
  };

  // Get the correct form component based on mode and type
  const getFormComponent = () => {
    if (!selectedFormType) return null;

    const commonProps = {
      show: true,
      handleClose: () => {
        setSelectedFormType(null);
        setSelectedData(null);
        setFormMode("add");
      },
      handleSubmit: handleFormSubmit,
      initialData: selectedData,
      mode: formMode,
      isLoading: isSubmitting,
      onFormTypeChange: () => {
        setSelectedFormType(null);
        setShowFormSelection(true);
      },
    };

    switch (selectedFormType) {
      case "warehouse":
        return <WarehouseForm {...commonProps} />;
      case "warehouseToParty":
        return <WarehouseToPartyForm {...commonProps} />;
      default:
        return null;
    }
  };

  // Update handleViewButton function
  const handleViewButton = async (id) => {
    const selectedRow = filteredData.find((item) => item.id === id);

    if (!selectedRow) {
      return toast.error("Data not found for this ID");
    }

    // Check for digitalSignatureId before calling the API
    if (
      !selectedRow.digitalSignatureId ||
      selectedRow.digitalSignatureId === "Unknown"
    ) {
      console.log("No digitalSignatureId found for this entry:", selectedRow);
      const invoiceData = mapToInvoiceData(selectedRow);
      setSelectedInvoiceData(invoiceData);
      setShowInvoiceModal(true);
      return;
    }

    try {
      console.log(
        "Fetching Digital Signature for ID:",
        selectedRow.digitalSignatureId,
      );
      const response = await getDigitalSignatureApi(
        selectedRow.digitalSignatureId,
      );

      const base64Image = response?.signatureImage;
      const invoiceData = mapToInvoiceData(selectedRow);

      if (base64Image) {
        invoiceData.digitalSignature = `data:image/jpeg;base64,${base64Image}`;
      }

      setSelectedInvoiceData(invoiceData);
      setShowInvoiceModal(true);
    } catch (error) {
      console.error("Error fetching digital signature:", error);
      const invoiceData = mapToInvoiceData(selectedRow);
      setSelectedInvoiceData(invoiceData);
      setShowInvoiceModal(true);
      toast.warn("Showing invoice without digital signature");
    }
  };

  // Helper function to map API data to invoice format
  const mapToInvoiceData = (apiData) => {
    const firstProduct = apiData.products?.[0] || {};

    const totalBags =
      apiData.products?.reduce(
        (sum, product) => sum + (product.totalBags || 0),
        0,
      ) || 0;
    const totalQuantityKg =
      apiData.products?.reduce(
        (sum, product) => sum + (product.quantityMT || 0),
        0,
      ) || 0;

    return {
      companyName: apiData.companyName,
      companyAddress: apiData.companyAddress,
      companyEmail: apiData.companyEmail,
      gstIn: apiData.companygstNumber,
      companyOfficeNumber: apiData.companyofficeNumber,
      companyMobileNumber: apiData.companymobileNumber,

      date: apiData.date,
      receiptNo: apiData.receiptNo,

      vehicleName: apiData.vehicleName,
      ownerName: apiData.companyName,

      startLocation: apiData.startLocation,
      endLocation: apiData.endLocation,
      containerNumber: "N/A",
      sealNumber: "N/A",

      consignorName: apiData.consignorName,
      consignorAddress: apiData.consignorAddress,
      consigneeName: apiData.consigneeName,
      consigneeAddress: apiData.consigneeAddress,

      materialOwner: apiData.materialOwner,
      materialAddress: apiData.materialAddress,

      itemName:
        firstProduct.productName ||
        apiData.products?.map((p) => p.productName).join(", ") ||
        "N/A",
      itemQuantity: totalBags,
      itemUnit: "Bags",
      itemWeight: totalQuantityKg,
      itemcost: apiData.totalAmount,

      customerRate: apiData.customerRate,
      customerRateOn: apiData.customerRateOn,
      customerFreight: apiData.customerFreight,
      totalAmount: apiData.totalAmount,

      transporterRate: apiData.transporterRate,
      transporterRateOn: apiData.transporterRateOn,
      transporterFreight: apiData.transporterFreight,
      totalTransporterAmount: apiData.totalTransporterAmount,

      driverName: apiData.driverName,
      driverContact: "N/A",
      driverId: apiData.driverId,

      status: apiData.status,

      issuedBy: apiData.issuedBy,
      receivedBy: apiData.receivedBy,
      products: apiData.products || [],
    };
  };

  // Check if any filter is active
  const isAnyFilterActive = () => {
    return (
      selectedConsignor ||
      selectedConsignee ||
      selectedCompany ||
      selectedName ||
      selectedWorker ||
      selectedStatus !== "All" ||
      dateRange.startDate ||
      searchQuery
    );
  };

  return (
    <>
      <ToastContainer />
      <div className="mb-3 flex justify-between items-center gap-2 w-full">
        <div className="flex items-center gap-2">
          <DateRangeFilterCredence
            title="Date Range"
            onDateRangeChange={handleDateRangeChange}
          />

          {/* Consignor and Consignee Dropdowns */}
          <div>
            <SingleSelectDropdown
              options={consignorOptions}
              value={selectedConsignor}
              onChange={setSelectedConsignor}
              isClearable
              placeholder="Consignor..."
              width="100px"
            />
          </div>

          <div>
            <SingleSelectDropdown
              options={consigneeOptions}
              value={selectedConsignee}
              onChange={setSelectedConsignee}
              isClearable
              placeholder="Consignee..."
              width="100px"
            />
          </div>

          <div>
            <SingleSelectDropdown
              options={companyOptions}
              value={selectedCompany}
              onChange={setSelectedCompany}
              isClearable
              placeholder="Company..."
              width="100px"
            />
          </div>

          {/* Clear Filters Button - Only show when filters are active */}
          {isAnyFilterActive() && (
            <button
              onClick={clearAllFilters}
              className="flex items-center gap-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              Clear Filters
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            placeholder="Search by vehicle, driver, consignor..."
          />
          <button
            onClick={handleAddButtonClick}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white"
          >
            Add Lorry Receipt
          </button>
        </div>
      </div>

      {/* ADDED: Status Filter Buttons Section */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="font-medium text-gray-700">Status :</span>

          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={() => handleStatusFilterClick(status.value)}
              style={getStatusButtonStyle(status.value)}
              className="px-4 py-1.5 rounded-full text-sm font-medium
                   transition-all duration-200
                   hover:shadow-md"
            >
              {status.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Type Selection Modal */}
      {showFormSelection && (
        <FormTypeSelection
          show={showFormSelection}
          handleClose={() => {
            setShowFormSelection(false);
          }}
          onSelectType={(type) => {
            setSelectedFormType(type);
            setShowFormSelection(false);
          }}
        />
      )}

      {/* Actual Form Component */}
      {getFormComponent()}

      <TableArray
        title="TP Pass Receipts"
        columns={frontendColumns}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        isFetching={isFetching}
        viewButton={true}
        viewButtonLabel="Invoice"
        handleViewButton={handleViewButton}
      />

      <SmartPagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          const newItems = value === -1 ? filteredData.length : value;
          setItemsPerPage(newItems);
          setCurrentPage(1);
        }}
      />
      {/* Image Viewer Modal */}
      {showImageModal && selectedImageUrl && (
        <div className="fixed inset-0 z-[9999]">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75"
            onClick={() => setShowImageModal(false)}
          ></div>

          {/* Modal Content */}
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Acknowledgement Image
                </h3>
                <div className="flex items-center gap-2">
                  {/* Download Button */}
                  <button
                    onClick={() => {
                      // Create a temporary anchor element
                      const link = document.createElement("a");
                      link.href = selectedImageUrl;
                      link.download = `acknowledgement-${Date.now()}.jpg`; // You can customize the filename
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                    }}
                    className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    title="Download Image"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                    Download
                  </button>

                  {/* Close Button */}
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="text-gray-500 hover:text-gray-700 p-1"
                  >
                    <svg
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                <img
                  src={selectedImageUrl}
                  alt="Acknowledgement"
                  className="w-full h-auto rounded max-h-[70vh] mx-auto object-contain"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src =
                      "https://via.placeholder.com/400x300?text=Image+Not+Found";
                  }}
                />
              </div>
              <div className="border-t p-4 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  Click image to open in new tab
                </div>
                <div className="flex gap-2">
                  {/* Optional: Add a button to open image in new tab */}
                  <a
                    href={selectedImageUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50 transition-colors"
                  >
                    Open Full Size
                  </a>
                  <button
                    onClick={() => setShowImageModal(false)}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Invoice Bill Modal */}
      {showInvoiceModal && (
        <div className="fixed inset-0 z-[100]">
          <div
            className="fixed inset-0 bg-gray-900 bg-opacity-75"
            onClick={() => setShowInvoiceModal(false)}
          ></div>
          <div className="relative z-10 flex items-center justify-center min-h-screen p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
              <div className="flex justify-between items-center p-4 border-b">
                <h3 className="text-lg font-medium text-gray-900">
                  Transport Pass Invoice -{" "}
                  {selectedInvoiceData?.receiptNo || "N/A"}
                </h3>
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="text-gray-500 hover:text-gray-700 p-1"
                >
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <div className="p-4 overflow-auto max-h-[calc(90vh-80px)]">
                {selectedInvoiceData ? (
                  <TpInvoiceBill invoiceData={selectedInvoiceData} />
                ) : (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No invoice data available.</p>
                  </div>
                )}
              </div>
              <div className="border-t p-4 text-right">
                <button
                  onClick={() => setShowInvoiceModal(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

// Form Type Selection Component - Fixed with visible modal
const FormTypeSelection = ({ show, handleClose, onSelectType }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Semi-transparent backdrop - LOWER OPACITY */}
      <div
        className="absolute inset-0 bg-black bg-opacity-30"
        onClick={handleClose}
      ></div>

      {/* Modal Content */}
      <div className="relative bg-white rounded-xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-gray-50 px-6 py-5 border-b">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xl font-bold text-gray-800">
                Select TP Pass Type
              </h3>
              <p className="text-gray-600 text-sm mt-1">
                Choose the type of transport pass to create
              </p>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 p-2 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Close"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <div className="space-y-6">
            {/* Option 1: Railhead to Warehouse/Party */}
            <div
              className="group border-2 border-green-200 rounded-xl p-5 hover:border-green-400 hover:bg-green-50 cursor-pointer transition-all duration-200"
              onClick={() => onSelectType("warehouse")}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-green-200 transition-colors">
                  <FaWarehouse className="text-green-600 text-2xl" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg mb-1">
                        Railhead to Warehouse/Party
                      </h4>
                      <p className="text-gray-600 text-sm">
                        For shipments originating from Railhead and delivered to
                        Warehouse or Party
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="px-3 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full">
                        Default
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <div className="flex items-center mr-4">
                      <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
                      <span>
                        Issued by: <strong>Railhead</strong>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
                      <span>
                        Received by: <strong>Warehouse/Party</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-right">
                <button className="px-5 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors font-medium group-hover:shadow-md">
                  Select This Option →
                </button>
              </div>
            </div>

            {/* Option 2: Warehouse to Party */}
            <div
              className="group border-2 border-yellow-200 rounded-xl p-5 hover:border-yellow-400 hover:bg-yellow-50 cursor-pointer transition-all duration-200"
              onClick={() => onSelectType("warehouseToParty")}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 w-14 h-14 bg-yellow-100 rounded-xl flex items-center justify-center mr-4 group-hover:bg-yellow-200 transition-colors">
                  <FaExchangeAlt className="text-yellow-600 text-2xl" />
                </div>
                <div className="flex-grow">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-gray-800 text-lg mb-1">
                        Warehouse to Party
                      </h4>
                      <p className="text-gray-600 text-sm">
                        For shipments originating from Warehouse and delivered
                        directly to Party
                      </p>
                    </div>
                    <div className="flex items-center">
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                        Direct Delivery
                      </span>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center text-sm text-gray-500">
                    <div className="flex items-center mr-4">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full mr-2"></div>
                      <span>
                        Issued by: <strong>Warehouse</strong>
                      </span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-2"></div>
                      <span>
                        Received by: <strong>Party</strong>
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 text-right">
                <button className="px-5 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors font-medium group-hover:shadow-md">
                  Select This Option →
                </button>
              </div>
            </div>
          </div>

          {/* Cancel Button */}
          <div className="mt-8 pt-6 border-t text-center">
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gradient-to-r from-[#504255] to-[#cbb4d4] text-white"
            >
              Cancel Selection
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GodownLr;
