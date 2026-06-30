// ESC/POS Thermal Printer Driver via WebUSB
// Compatible with XP-80, Epson, and standard ESC/POS thermal receipt printers

export class UsbPrinter {
  constructor() {
    this.device = null;
    this.endpoint = null;
  }

  /**
   * Request printer device and claim the printing interface
   */
  async connect() {
    if (!navigator.usb) {
      throw new Error("WebUSB API is not supported in this browser. Please use Chrome, Edge, or Opera.");
    }

    try {
      // Prompt user to select USB device. classCode: 7 is the standard printer class
      this.device = await navigator.usb.requestDevice({
        filters: [{ classCode: 7 }]
      });

      await this.device.open();
      
      // Select configuration (usually 1)
      if (this.device.configuration === null) {
        await this.device.selectConfiguration(1);
      }

      // Scan interfaces and claim the one that matches classCode 7
      let interfaceFound = false;
      const interfaces = this.device.configuration.interfaces;
      
      for (const iface of interfaces) {
        const alternate = iface.alternates[0];
        if (alternate.interfaceClass === 7) {
          await this.device.claimInterface(iface.interfaceNumber);
          interfaceFound = true;
          
          // Find the OUT endpoint for writing data
          for (const ep of alternate.endpoints) {
            if (ep.direction === 'out') {
              this.endpoint = ep.endpointNumber;
              break;
            }
          }
          break;
        }
      }

      if (!interfaceFound || !this.endpoint) {
        throw new Error("Failed to find print interface or OUT endpoint on the selected USB device.");
      }

      // Store success in localStorage
      localStorage.setItem('usb_printer_connected', 'true');
      localStorage.setItem('usb_printer_name', this.device.productName || 'USB Thermal Printer');

      // Print a quick notification test print (optional, but let's just return)
      return this.device;
    } catch (err) {
      console.error("WebUSB connection error:", err);
      throw err;
    }
  }

  /**
   * Try to auto-connect to an already-paired USB device
   */
  async autoConnect() {
    if (!navigator.usb) return null;

    try {
      const devices = await navigator.usb.getDevices();
      if (devices.length === 0) return null;

      // Find the first device that fits the printer class
      for (const dev of devices) {
        this.device = dev;
        await this.device.open();
        
        if (this.device.configuration === null) {
          await this.device.selectConfiguration(1);
        }

        let interfaceFound = false;
        const interfaces = this.device.configuration.interfaces;
        
        for (const iface of interfaces) {
          const alternate = iface.alternates[0];
          if (alternate.interfaceClass === 7) {
            await this.device.claimInterface(iface.interfaceNumber);
            interfaceFound = true;
            
            for (const ep of alternate.endpoints) {
              if (ep.direction === 'out') {
                this.endpoint = ep.endpointNumber;
                break;
              }
            }
            break;
          }
        }

        if (interfaceFound && this.endpoint) {
          localStorage.setItem('usb_printer_connected', 'true');
          localStorage.setItem('usb_printer_name', this.device.productName || 'USB Thermal Printer');
          return this.device;
        }
      }
      return null;
    } catch (err) {
      console.error("WebUSB Auto-Connect error:", err);
      return null;
    }
  }

  /**
   * Format receipt data as ESC/POS raw bytes and print
   */
  async printReceipt(sale, settings, widthType = '80mm', printBarcode = true) {
    if (!this.device || !this.endpoint) {
      // Try auto-connect if connection lost
      const connected = await this.autoConnect();
      if (!connected) {
        throw new Error("USB Printer is not connected. Please connect the printer first.");
      }
    }

    const encoder = new TextEncoder();
    const commands = [];

    // ESC/POS control characters
    const ESC = 0x1B;
    const GS = 0x1D;
    const LF = 0x0A;

    // 1. Initialize printer (ESC @)
    commands.push(ESC, 0x40);

    // 2. Align Center for store header
    commands.push(ESC, 0x61, 0x01);

    // 3. Double size text + Bold for store name
    commands.push(GS, 0x21, 0x11); // Double width & height
    commands.push(ESC, 0x45, 0x01); // Bold on
    commands.push(...Array.from(encoder.encode((settings.storeName || 'Store').toUpperCase() + "\n")));
    
    // Reset to normal font settings
    commands.push(GS, 0x21, 0x00); // Normal size
    commands.push(ESC, 0x45, 0x00); // Bold off

    // 4. Address, Phone, Website
    if (settings.address) {
      commands.push(...Array.from(encoder.encode(settings.address + "\n")));
    }
    if (settings.phone) {
      commands.push(...Array.from(encoder.encode(`Phone: ${settings.phone}\n`)));
    }
    if (settings.email) {
      commands.push(...Array.from(encoder.encode(`Email: ${settings.email}\n`)));
    }
    
    // Receipt divider
    const maxChars = widthType === '58mm' ? 32 : 48;
    const divider = "=".repeat(maxChars) + "\n";
    commands.push(...Array.from(encoder.encode(divider)));

    // 5. Left Align for Date & Transaction Info
    commands.push(ESC, 0x61, 0x00);
    const dateStr = new Date(sale.createdAt || new Date()).toLocaleString();
    commands.push(...Array.from(encoder.encode(`Date: ${dateStr}\n`)));
    commands.push(...Array.from(encoder.encode(`Receipt No: ${sale.receiptNo}\n`)));
    commands.push(...Array.from(encoder.encode("-".repeat(maxChars) + "\n")));

    // 6. Print item lines based on printer width
    if (widthType === '80mm') {
      // 80mm table header: Item Name (24 chars), Qty (6 chars), Price (8 chars), Total (10 chars)
      const header = "Item Name".padEnd(24) + "Qty".padStart(6) + "Price".padStart(8) + "Total".padStart(10) + "\n";
      commands.push(ESC, 0x45, 0x01); // Bold
      commands.push(...Array.from(encoder.encode(header)));
      commands.push(ESC, 0x45, 0x00); // Bold off
      commands.push(...Array.from(encoder.encode("-".repeat(maxChars) + "\n")));

      sale.items.forEach(item => {
        const name = item.name.length > 22 ? item.name.substring(0, 22) + ".." : item.name;
        const qtyStr = String(item.quantity || item.qty);
        const priceStr = parseFloat(item.price).toFixed(2);
        const totalStr = parseFloat(item.total).toFixed(2);

        const row = name.padEnd(24) + qtyStr.padStart(6) + priceStr.padStart(8) + totalStr.padStart(10) + "\n";
        commands.push(...Array.from(encoder.encode(row)));
      });
    } else {
      // 58mm layout: Item (16 chars), Qty (4 chars), Total (12 chars)
      const header = "Item Name".padEnd(16) + "Qty".padStart(4) + "Total".padStart(12) + "\n";
      commands.push(ESC, 0x45, 0x01); // Bold
      commands.push(...Array.from(encoder.encode(header)));
      commands.push(ESC, 0x45, 0x00); // Bold off
      commands.push(...Array.from(encoder.encode("-".repeat(maxChars) + "\n")));

      sale.items.forEach(item => {
        const name = item.name.length > 14 ? item.name.substring(0, 14) + ".." : item.name;
        const qtyStr = String(item.quantity || item.qty);
        const totalStr = parseFloat(item.total).toFixed(2);

        const row = name.padEnd(16) + qtyStr.padStart(4) + totalStr.padStart(12) + "\n";
        commands.push(...Array.from(encoder.encode(row)));

        // Additional detail line for price: e.g. " (2 x Rs.150.00)"
        const priceStr = parseFloat(item.price).toFixed(2);
        const detail = `  (${qtyStr} x ${settings.currency || 'Rs.'}${priceStr})\n`;
        commands.push(...Array.from(encoder.encode(detail)));
      });
    }

    commands.push(...Array.from(encoder.encode("=".repeat(maxChars) + "\n")));

    // 7. Totals summary rows
    const formatTotalRow = (label, val) => {
      const valStr = (settings.currency || 'Rs.') + parseFloat(val).toFixed(2);
      const spacesCount = maxChars - label.length - valStr.length;
      const spaces = " ".repeat(spacesCount > 0 ? spacesCount : 1);
      return label + spaces + valStr + "\n";
    };

    const subtotal = sale.totalAmount + (sale.discount || 0);
    commands.push(...Array.from(encoder.encode(formatTotalRow("Subtotal:", subtotal))));
    
    if (sale.discount > 0) {
      commands.push(...Array.from(encoder.encode(formatTotalRow("Discount:", sale.discount))));
    }

    // Bold total
    commands.push(ESC, 0x45, 0x01);
    commands.push(...Array.from(encoder.encode(formatTotalRow("Total Amount:", sale.totalAmount))));
    commands.push(ESC, 0x45, 0x00);

    commands.push(...Array.from(encoder.encode(formatTotalRow("Paid Cash:", sale.paidAmount))));
    commands.push(...Array.from(encoder.encode(formatTotalRow("Change Return:", sale.change))));
    
    commands.push(...Array.from(encoder.encode("=".repeat(maxChars) + "\n")));

    // 8. Footer (Centered)
    commands.push(ESC, 0x61, 0x01);
    if (settings.receiptFooter) {
      commands.push(...Array.from(encoder.encode(settings.receiptFooter + "\n")));
    }
    commands.push(...Array.from(encoder.encode("================================\n")));

    // 9. Generate Barcode (GS k) if receiptNo exists and printBarcode is checked
    if (printBarcode && sale.receiptNo) {
      commands.push(LF, LF); // spacing

      // Barcode configurations
      commands.push(GS, 0x68, 60); // Barcode height (60 dots)
      commands.push(GS, 0x77, 2);  // Barcode width (2 dots)
      commands.push(GS, 0x48, 2);  // Position of text: printed below barcode

      // Code 128 (Format m=73) Barcode print
      // Syntax: GS k 73 {length} {string}
      const barcodeStr = sale.receiptNo.toUpperCase();
      commands.push(GS, 0x6B, 73, barcodeStr.length, ...Array.from(encoder.encode(barcodeStr)));
      commands.push(LF);
    }

    // 10. Feed paper (5 lines) and Cut
    commands.push(LF, LF, LF, LF, LF);
    commands.push(GS, 0x56, 66, 0); // GS V 66 0 (Feed and cut)

    // Write to endpoint
    const dataBuffer = new Uint8Array(commands);
    
    try {
      await this.device.transferOut(this.endpoint, dataBuffer.buffer);
    } catch (writeErr) {
      console.error("USB transferOut error. Retrying interface claim...", writeErr);
      // Re-claim and retry once
      await this.device.claimInterface(this.device.configuration.interfaces[0].interfaceNumber);
      await this.device.transferOut(this.endpoint, dataBuffer.buffer);
    }
  }
}

// Single instance exports to share connection states
export const usbPrinter = new UsbPrinter();
