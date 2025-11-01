import { useState, useEffect, useContext } from "react";
import { AuthContext, API } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { toast } from "sonner";
import { ShoppingBag, Coins, Server, ArrowLeft, Package } from "lucide-react";

export default function Shop() {
  const { user, setUser } = useContext(AuthContext);
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/shop/products`, { headers });
      setProducts(response.data);
    } catch (error) {
      toast.error("Error al cargar productos");
    } finally {
      setLoading(false);
    }
  };

  const purchaseProduct = async (productId) => {
    try {
      const response = await axios.post(`${API}/shop/purchase/${productId}`, {}, { headers });
      toast.success(response.data.message);
      setUser({ ...user, credits: response.data.remaining_credits });
      fetchProducts(); // Reload to update stock
    } catch (error) {
      toast.error(error.response?.data?.detail || "Error al realizar la compra");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-950 via-purple-900 to-indigo-950">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/dashboard")}
                data-testid="back-to-dashboard-button"
                className="text-white hover:bg-purple-600/50"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-6 h-6 text-purple-400" />
                <span className="text-2xl font-bold text-white">Tienda</span>
              </div>
            </div>
            <div className="flex items-center space-x-2 bg-purple-600/30 px-4 py-2 rounded-full">
              <Coins className="w-5 h-5 text-yellow-400" />
              <span className="text-white font-bold" data-testid="user-credits">{user?.credits || 0}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center text-white text-xl">Cargando productos...</div>
        ) : products.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-20 h-20 text-purple-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">No hay productos disponibles</h2>
            <p className="text-purple-200 mb-6">El administrador aún no ha agregado productos a la tienda.</p>
            <Button
              onClick={() => navigate("/dashboard")}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
            >
              Volver al Dashboard
            </Button>
          </div>
        ) : (
          <div>
            <h1 className="text-3xl font-bold text-white mb-8">Servidores de Hosting Disponibles</h1>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => (
                <Card
                  key={product.id}
                  className="glass-effect border-purple-500/30 hover-lift"
                  data-testid={`product-card-${product.id}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-2">
                        <Server className="w-6 h-6 text-purple-400" />
                        <CardTitle className="text-white">{product.name}</CardTitle>
                      </div>
                      {product.stock > 0 ? (
                        <Badge className="bg-green-600 text-white" data-testid={`product-stock-${product.id}`}>
                          Stock: {product.stock}
                        </Badge>
                      ) : (
                        <Badge variant="destructive" data-testid={`product-stock-${product.id}`}>
                          Agotado
                        </Badge>
                      )}
                    </div>
                    <CardDescription className="text-purple-200">
                      {product.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-center space-x-2 bg-purple-900/50 py-4 rounded-lg">
                      <Coins className="w-8 h-8 text-yellow-400" />
                      <span className="text-3xl font-bold text-white" data-testid={`product-price-${product.id}`}>
                        {product.price}
                      </span>
                      <span className="text-purple-200">créditos</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button
                      onClick={() => purchaseProduct(product.id)}
                      disabled={product.stock <= 0 || (user?.credits || 0) < product.price}
                      data-testid={`purchase-button-${product.id}`}
                      className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-semibold disabled:opacity-50"
                    >
                      {product.stock <= 0
                        ? "Agotado"
                        : (user?.credits || 0) < product.price
                        ? "Créditos Insuficientes"
                        : "Comprar Ahora"}
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
