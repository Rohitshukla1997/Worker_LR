// export const formatDateToDDMMYYYY = (dateString) => {
//     if (!dateString) return '';

//     const date = new Date(dateString);
//     if (isNaN(date)) return '';

//     const day = String(date.getDate()).padStart(2, '0');
//     const month = String(date.getMonth() + 1).padStart(2, '0');
//     const year = date.getFullYear();

//     return `${day}/${month}/${year}`;
// };





export const useSplitTimeDate = (isoDate) => {
    const dateObj = new Date(isoDate)
    const day = String(dateObj.getUTCDate()).padStart(2, '0')
    const month = String(dateObj.getUTCMonth() + 1).padStart(2, '0')
    const year = dateObj.getUTCFullYear()
    return `${day}-${month}-${year}`
}
