import React, { useState, useEffect } from "react";
import api from "../../api";
import PrintableGRC from "../../components/PrintableGRC";
import { Printer, RefreshCcw } from "lucide-react";
import { showSuccess, showError } from "../../utils/alerts";

export default function StaffGRC() {
  const [grcNo, setGrcNo] = useState(1);
  const [loading, setLoading] = useState(true);
  const [resetVal, setResetVal] = useState(1);

  // Fetch current GRC number
  useEffect(() => {
    fetchGrcNumber();
  }, []);

  const fetchGrcNumber = async () => {
    try {
      setLoading(true);
      const res = await api.get("/api/grc"); 
      setGrcNo(res.data.sequence_value);
    } catch (error) {
      console.error("Failed to fetch GRC number", error);
      showError("Error", "Failed to fetch GRC number");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    window.print();
    
    // Increment after printing
    try {
      const res = await api.post("/api/grc/increment");
      setGrcNo(res.data.sequence_value);
    } catch (error) {
      console.error("Failed to increment GRC number", error);
    }
  };

  const handleReset = async () => {
    if (window.confirm(`Are you sure you want to reset GRC No. to ${resetVal}?`)) {
      try {
        const res = await api.post("/api/grc/reset", { sequence_value: resetVal });
        setGrcNo(res.data.sequence_value);
        showSuccess("Success", res.data.message);
      } catch (error) {
        console.error("Failed to reset GRC number", error);
        showError("Error", "Failed to reset GRC number");
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full text-amber-500 font-bold">
        Loading GRC Form...
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-[900px] mx-auto min-h-screen print:p-0 print:m-0 print:max-w-none print:bg-white print:min-h-0">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 no-print gap-4 glass p-4 rounded-2xl border border-saffron-500/20">
        <h1 className="text-2xl font-bold font-display text-saffron-500">Print GRC Form</h1>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-slate-950/80 p-2 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-400 font-medium">Reset to:</span>
            <input 
              type="number" 
              value={resetVal} 
              onChange={(e) => setResetVal(Number(e.target.value))}
              className="bg-transparent border-none text-slate-100 w-16 text-center outline-none font-bold"
              min="1"
            />
            <button 
              onClick={handleReset}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 rounded-lg transition-colors"
              title="Reset GRC Number"
            >
              <RefreshCcw className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-saffron-500 to-saffron-600 hover:from-saffron-400 hover:to-saffron-500 text-lagoon-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-saffron-500/20 active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print GRC Form</span>
          </button>
        </div>
      </div>

      <div className="bg-white shadow-2xl rounded-sm overflow-hidden p-8 print:p-0 print:shadow-none print:bg-white print:rounded-none">
        <PrintableGRC grcNo={grcNo} />
      </div>
    </div>
  );
}
