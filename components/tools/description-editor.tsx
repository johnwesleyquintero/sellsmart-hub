const handleExport = () => {
  if (products.length === 0) return;

  const csvData = products.map((product) => ({
    product: product.product,
    asin: product.asin || "",
    description: product.description,
    character_count: product.characterCount,
    keyword_count: product.keywordCount,
    score: product.score || 0,
  }));

  const csv = Papa.unparse(csvData);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", "optimized_descriptions.csv");
  link.style.visibility = "hidden";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
