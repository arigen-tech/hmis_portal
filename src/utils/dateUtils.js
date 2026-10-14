/**
 * Date and time display formatting utilities
 */

export const formatDateForDisplay = (dateString) => {
    if (!dateString || dateString === 'N/A' || dateString === '-') return "N/A";
    try {
        // If already formatted as DD/MM/YYYY
        if (typeof dateString === 'string' && /^\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
            return dateString;
        }
        // If DD-MM-YYYY format
        if (typeof dateString === 'string' && /^\d{2}-\d{2}-\d{4}/.test(dateString)) {
            const [d, m, y] = dateString.split('-');
            return `${d}/${m}/${y}`;
        }
        // Handle YYYY-MM-DD or YYYY-MM-DDTHH:mm:ss directly to avoid UTC timezone offset shifts
        if (typeof dateString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateString)) {
            const datePart = dateString.split('T')[0].split(' ')[0];
            const [year, month, day] = datePart.split('-');
            if (year && month && day) {
                return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year}`;
            }
        }
        const date = new Date(dateString);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    } catch (error) {
        console.error("Error formatting date:", error);
        return "N/A";
    }
};

export const formatDateTimeForDisplay = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === 'N/A' || dateTimeString === '-') return "N/A";
    try {
        if (typeof dateTimeString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateTimeString)) {
            const [datePart, timePart] = dateTimeString.split(/[T ]/);
            const [year, month, day] = datePart.split('-');
            const hours = timePart ? timePart.split(':')[0] : '00';
            const minutes = timePart ? timePart.split(':')[1] : '00';
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
        }
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
        console.error("Error formatting date time:", error);
        return "N/A";
    }
};

export const formatDateTimeWithSecondsForDisplay = (dateTimeString) => {
    if (!dateTimeString || dateTimeString === 'N/A' || dateTimeString === '-') return "N/A";
    try {
        if (typeof dateTimeString === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateTimeString)) {
            const [datePart, timePart] = dateTimeString.split(/[T ]/);
            const [year, month, day] = datePart.split('-');
            const parts = timePart ? timePart.split(':') : ['00', '00', '00'];
            const hours = parts[0] || '00';
            const minutes = parts[1] || '00';
            const seconds = parts[2] ? parts[2].substring(0, 2) : '00';
            return `${day.padStart(2, '0')}/${month.padStart(2, '0')}/${year} ${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:${seconds.padStart(2, '0')}`;
        }
        const date = new Date(dateTimeString);
        if (isNaN(date.getTime())) return "N/A";
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    } catch (error) {
        console.error("Error formatting date time with seconds:", error);
        return "N/A";
    }
};

export const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const str = String(timeStr).trim().toUpperCase();
    const isPM = str.includes('PM');
    const isAM = str.includes('AM');
    const cleanStr = str.replace(/[A-Z]/g, '').trim();
    const parts = cleanStr.split(':').map(Number);
    let hours = parts[0] || 0;
    const minutes = parts[1] || 0;
    
    if (isPM && hours < 12) hours += 12;
    if (isAM && hours === 12) hours = 0;
    
    return hours * 60 + minutes;
};
