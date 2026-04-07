import React, { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import SmartPagination from "../../ReusableComponents/SmartPagination";
import Table from "../../ReusableComponents/Table";
import SearchInput from "../../ReusableComponents/SearchInput";
import { getRailHeadApi } from "../data/data";

const RailheadIventory = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [filteredData, setFilteredData] = useState([]);

  const { data, isFetching } = useQuery({
    queryKey: [
      "RailHead",
      { search: searchQuery, page: currentPage, limit: itemsPerPage },
    ],
    queryFn: getRailHeadApi,
    keepPreviousData: true,
    staleTime: 1000 * 60 * 1, // 1 minute (data is fresh for 1 min)
    cacheTime: 1000 * 60 * 1, // 1 minute (kept in memory after unmount)
  });

  useEffect(() => {
    if (data?.data) {
      setFilteredData(data.data);
    }
  }, [data]);

  const columns = [
    { label: "Date", key: "createdAt", sortable: true },
    { label: "Product Name", key: "productName", sortable: true },
    { label: "Bag Size", key: "bagSize", sortable: true },
    { label: "Total Bags", key: "totalBags", sortable: true },
    { label: "Quantity(MT)", key: "quantityMT", sortable: true },
  ];

  return (
    <div>
      <ToastContainer />

      <div className="mb-4 d-flex justify-content-end">
        <SearchInput
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          placeholder="Search products..."
        />
      </div>

      <Table
        title="Rail Head Inventory"
        columns={columns}
        filteredData={filteredData}
        setFilteredData={setFilteredData}
        currentPage={currentPage}
        itemsPerPage={itemsPerPage}
        isFetching={isFetching}
      />

      <SmartPagination
        totalPages={data?.totalPages || 1}
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={(value) => {
          setItemsPerPage(value === -1 ? filteredData.length : value);
          setCurrentPage(1);
        }}
      />
    </div>
  );
};

export default RailheadIventory;
