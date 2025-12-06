import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import React, { useEffect, useMemo, useState } from "react";
import { getGodownTPApi, postGodownTPApi } from "../data/data";
import SearchInput from "../../ReusableComponents/SearchInput";
import SmartPagination from "../../ReusableComponents/SmartPagination";
import TableArray from "../../ReusableComponents/TableArray";
import AddButton from "../../ReusableComponents/AddButton";
import GodownTpFrom from "./component/GodownTpFrom";
import { toast } from "react-toastify";
import IconDropdown from "../../ReusableComponents/IconDropdown";
import { FaArrowUp, FaPrint } from "react-icons/fa";
import { HiOutlineLogout } from "react-icons/hi";
import { PiMicrosoftExcelLogo } from "react-icons/pi";
import usePdfExporter from "../../../customhooks/usePdfExporter";
import useExcelExporter from "../../../customhooks/useExcelExporter";

const GodownTP = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [searchQuery, setSearchQuery] = useState("");
  const { exportToPDF } = usePdfExporter();
  const { exportToExcel } = useExcelExporter();

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add");
  const [selectedData, setSelectedData] = useState(null);

  const queryClient = useQueryClient();

  // Fetch godown lorry receipts
  const { data: getGodownTP, isFetching } = useQuery({
    queryKey: [
      "getGodownTP",
      { search: searchQuery, page: currentPage, limit: itemsPerPage },
    ],
    queryFn: getGodownTPApi,
    keepPreviousData: true,
    staleTime: 10 * 60 * 1000, // 10 minutes
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // ========== POST (Create) ==========
  const { mutate: postGodownTP, isLoading: isSubmitting } = useMutation({
    mutationFn: postGodownTPApi,
    onSuccess: () => {
      toast.success("Lorry receipt added successfully!");
      queryClient.invalidateQueries({ queryKey: ["getGodownTP"] });
      setShowForm(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add lorry receipt");
    },
  });

  // Set filtered data when API returns
  useEffect(() => {
    if (getGodownTP?.data) {
      setFilteredData(getGodownTP.data);
    } else {
      setFilteredData([]);
    }
  }, [getGodownTP]);

  const totalPages = getGodownTP?.totalPages || 1;

  const handleFormSubmit = (formData) => {
    if (formMode === "add") {
      postGodownTP(formData);
    } else if (formMode === "edit" && selectedData?._id) {
      updateGodownTP({ id: selectedData._id, data: formData });
    }
  };

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
          : "#6c757d",
      color: "white",
    };
  };

  // Add action column
  const columns = [
    {
      label: "Date",
      key: "date",
      sortable: true,
    },
    { label: "Owner Name", key: "ownerName", sortable: true },
    { label: "Consignor Name", key: "consignorName", sortable: true },
    { label: "Consignor Address", key: "consignorAddress" },
    { label: "Consignee Name", key: "consigneeName", sortable: true },
    { label: "Consignee Address", key: "consigneeAddress" },
    { label: "Customer Name", key: "customerName", sortable: true },
    { label: "Customer Address", key: "customerAddress" },
    { label: "Start Location", key: "startLocation", sortable: true },
    { label: "End Location", key: "endLocation", sortable: true },
    { label: "Vehicle Name", key: "vehicleName", sortable: true },
    { label: "Driver Name", key: "driverName", sortable: true },
    { label: "Worker Name", key: "workerName", sortable: true },
    {
      label: "Customer Rate",
      key: "customerRate",
      sortable: true,
      render: (item) => `₹${item.customerRate || 0}`,
    },
    {
      label: "Transporter Rate",
      key: "transporterRate",
      sortable: true,
      render: (item) => `₹${item.transporterRate || 0}`,
    },
    {
      label: "Customer Freight",
      key: "customerFreight",
      sortable: true,
      render: (item) => `₹${item.customerFreight || 0}`,
    },
    {
      label: "Transporter Freight",
      key: "transporterFreight",
      sortable: true,
      render: (item) => `₹${item.transporterFreight || 0}`,
    },
    {
      label: "Total Amount",
      key: "totalAmount",
      sortable: true,
      render: (item) => `₹${item.totalAmount || 0}`,
    },
    {
      label: "Total Transporter Amount",
      key: "totalTransporterAmount",
      sortable: true,
      render: (item) => `₹${item.totalTransporterAmount || 0}`,
    },
    { label: "Customer Rate On", key: "customerRateOn" },
    { label: "Transporter Rate On", key: "transporterRateOn" },
    {
      label: "Products",
      key: "products",
      render: (item) => {
        if (!item.products || item.products.length === 0) return "No products";
        return `${item.products.length} product(s)`;
      },
    },
    {
      label: "Status",
      key: "status",
      render: (row) => (
        <span style={getStatusStyle(row.status)}>
          {row.status || "Pending"}
        </span>
      ),
    },
  ];

  // Memoized dropdown items for export
  const dropdownItems = useMemo(
    () => [
      // {
      //   icon: FaRegFilePdf,
      //   label: "Download PDF",
      //   onClick: () =>
      //     exportToPDF({
      //       title: "All Worker List Report",
      //       columns,
      //       data: filteredData,
      //       fileName: "Worker_List_Report",
      //     }),
      // },
      {
        icon: PiMicrosoftExcelLogo,
        label: "Download Excel",
        onClick: () => {
          exportToExcel({
            title: "All Worker Godown TP List Report",
            columns,
            data: filteredData,
            fileName: "Worker_GodownTp_List_Report",
          });
        },
      },
      {
        icon: FaPrint,
        label: "Print Page",
        onClick: () => window.print(),
      },
      {
        icon: HiOutlineLogout,
        label: "Logout",
        onClick: () => handleLogout(),
      },
      {
        icon: FaArrowUp,
        label: "Scroll To Top",
        onClick: () => window.scrollTo({ top: 0, behavior: "smooth" }),
      },
    ],
    [filteredData, columns, exportToPDF, exportToExcel]
  );

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 mb-3">
        {/* Left: Date Range */}
        <div>
          {/* <DateRangeFilterCredence
            title="Date Range"
            onDateRangeChange={handleDateRangeChange}
          /> */}
        </div>

        {/* Right: Search + Add Button */}
        <div className="flex flex-wrap justify-end items-center gap-2 w-full md:w-auto">
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          />
          <AddButton
            label="Add Lorry Receipt"
            onClick={() => {
              setFormMode("add");
              setSelectedData(null);
              setShowForm(true);
            }}
          />
        </div>
      </div>

      <GodownTpFrom
        show={showForm}
        handleClose={() => {
          setShowForm(false);
          setSelectedData(null);
          setFormMode("add");
        }}
        handleSubmit={handleFormSubmit}
        initialData={selectedData}
        mode={formMode}
        isLoading={isSubmitting}
      />

      <TableArray
        title="Godown TP Pass"
        columns={columns}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        isFetching={isFetching}
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

      {/* dpdf and excel */}
      <div className="fixed bottom-0 right-0 m-3 mb-1 z-50">
        <IconDropdown items={dropdownItems} />
      </div>
    </>
  );
};

export default GodownTP;
