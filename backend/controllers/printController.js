const ThermalPrinter = require("node-thermal-printer").printer;
const PrinterTypes = require("node-thermal-printer").types;

// Function to print KOT
exports.printKOT = async (req, res) => {
  try {
    const { items, tableNo, orderNo, remarks, type } = req.body;

    // Use environment variable for IP or fallback to provided IP
    const printerIP = process.env.PRINTER_IP || "192.168.31.75";
    const printerPort = process.env.PRINTER_PORT || 9100;

    let printer = new ThermalPrinter({
      type: PrinterTypes.EPSON, // Using EPSON ESC/POS by default, which works for most thermal printers
      interface: `tcp://${printerIP}:${printerPort}`,
      characterSet: "PC858_EURO", // standard character set
      removeSpecialCharacters: false,
      lineCharacter: "-",
      options: {
        timeout: 5000 // 5 seconds timeout
      }
    });

    let isConnected = await printer.isPrinterConnected();
    if (!isConnected) {
      console.log("-----------------------------------------");
      console.log("PRINTER NOT CONNECTED. VIRTUAL KOT PRINT:");
      console.log(`Order No: ${orderNo || 'N/A'}`);
      console.log(`Table No: ${tableNo || 'N/A'}`);
      console.log(`Items:`, items);
      console.log("-----------------------------------------");
      return res.status(200).json({ message: "Test: Printer not connected, KOT logged to console." });
    }

    printer.alignCenter();
    printer.println("===============================");
    printer.bold(true);
    printer.println("KITCHEN ORDER TICKET (KOT)");
    printer.bold(false);
    printer.println("===============================");
    printer.newLine();
    
    printer.alignLeft();
    printer.println(`Order No: ${orderNo || 'N/A'}`);
    printer.println(`Table No: ${tableNo || 'N/A'}`);
    printer.println(`Type    : ${type || 'Dine-in'}`);
    printer.println(`Date    : ${new Date().toLocaleString()}`);
    printer.println("-------------------------------");
    
    printer.tableCustom([
      { text: "Item", align: "LEFT", width: 0.7 },
      { text: "Qty", align: "RIGHT", width: 0.25 }
    ]);
    printer.println("-------------------------------");

    if (items && items.length > 0) {
      items.forEach(item => {
        // Handle name if it exists, otherwise check for dish details depending on how frontend sends it
        const itemName = item.name || (item.dish && item.dish.name) || 'Unknown Item';
        printer.tableCustom([
          { text: itemName, align: "LEFT", width: 0.7 },
          { text: item.quantity.toString(), align: "RIGHT", width: 0.25 }
        ]);
      });
    }

    printer.println("-------------------------------");
    
    if (remarks) {
      printer.newLine();
      printer.println("Remarks:");
      printer.println(remarks);
    }

    printer.newLine();
    printer.newLine();
    printer.newLine();
    printer.cut();

    await printer.execute();
    res.status(200).json({ message: "KOT printed successfully" });

  } catch (error) {
    console.error("Print Error:", error);
    res.status(500).json({ message: "Error printing KOT", error: error.message });
  }
};
