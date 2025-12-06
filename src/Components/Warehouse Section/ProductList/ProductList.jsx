import React, { useEffect, useState } from "react";
import SmartPagination from "../../ReusableComponents/SmartPagination";
import Table from "../../ReusableComponents/Table";
import SearchInput from "../../ReusableComponents/SearchInput";
import { useQuery } from "@tanstack/react-query";
import { getProductListApi } from "../data/data";

const ProductList = () => {
  const [filteredData, setFilteredData] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch Inventory product list
  const { data: getProductList, isFetching } = useQuery({
    queryKey: [
      "getProductList",
      { search: searchQuery, page: currentPage, limit: itemsPerPage },
    ],
    queryFn: getProductListApi,
    keepPreviousData: true,

    // Data stays FRESH for 10 minutes (no refetch)
    staleTime: 10 * 60 * 1000, // 10 minutes

    // Data stays in cache for 10 minutes before being garbage-collected
    cacheTime: 10 * 60 * 1000, // 10 minutes
  });

  // Set filtered data when API returns
  useEffect(() => {
    if (getProductList?.data) {
      setFilteredData(getProductList.data);
    }
  }, [getProductList]);

  const totalPages = getProductList?.totalPages || 1;

  // Table columns
  const columns = [
    { label: "Product Name", key: "productName", sortable: true },
    { label: "Category", key: "category", sortable: true },
  ];

  return (
    <>
      <div className="mb-3 w-100 d-flex justify-content-end">
        <div style={{ width: "250px" }}>
          {" "}
          <SearchInput
            searchQuery={searchQuery}
            setSearchQuery={(value) => {
              setSearchQuery(value);
              setCurrentPage(1);
            }}
          />
        </div>
      </div>

      <Table
        title="Product List"
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
    </>
  );
};

export default ProductList;
