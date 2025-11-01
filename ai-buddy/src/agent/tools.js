const {tool} = require("@langchain/core/tools")
const { default: axios } = require("axios")
const { default: z } = require("zod")

const searchProduct = tool(async ({ query, token }) => {
  console.log("Quesry : ",query, "token:", token)
  const response = await axios.get(`http://localhost:3001/api/products?q=${query}`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return JSON.stringify(response.data)
}, {
  name: "searchProduct",
  description: "Search for Products based on a query",
  inputSchema: z.object({
    query: z.string().describe("The search query for products")
  })
})


const addProductToCart = tool(async ({ productId, qty = 1, token }) => {
  const response = await axios.post(`http://localhost:3002/api/cart/items`, {
    productId,
    qty
  }, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return `Added Product with id ${productId} (qty: ${qty}) to cart`
}, {
  name: "addProductToCart",
  description: "Add Product to the shopping cart",
  inputSchema: z.object({
    productId: z.string().describe("The id of the product to add to the cart"),
    qty: z.number().describe("The quantity of the product to add to the cart").default(1)
  }),
});

module.exports = {searchProduct,addProductToCart}