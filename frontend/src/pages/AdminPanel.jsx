import { useState, useEffect } from "react";
import { API } from "../App";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/ui/table";
import { toast } from "sonner";
import { Users, Settings as SettingsIcon, ShoppingBag, ArrowLeft, Plus, Trash2, Edit } from "lucide-react";

export default function AdminPanel() {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState({ credit_amount: 2, credit_interval: 300 });
  const [products, setProducts] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [creditAction, setCreditAction] = useState({ amount: 0, reason: "" });
  const [newProduct, setNewProduct] = useState({ name: "", description: "", price: 0, stock: 0 });
  const [editingProduct, setEditingProduct] = useState(null);

  const token = localStorage.getItem("token");
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    fetchUsers();
    fetchSettings();
    fetchProducts();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await axios.get(`${API}/admin/users`, { headers });
      setUsers(response.data);
    } catch (error) {
      toast.error("Error al cargar usuarios");
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await axios.get(`${API}/admin/settings`, { headers });
      setSettings(response.data);
    } catch (error) {
      toast.error("Error al cargar configuración");
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await axios.get(`${API}/admin/products`, { headers });
      setProducts(response.data);
    } catch (error) {
      toast.error("Error al cargar productos");
    }
  };

  const updateSettings = async () => {
    try {
      await axios.put(`${API}/admin/settings`, settings, { headers });
      toast.success("Configuración actualizada");
    } catch (error) {
      toast.error("Error al actualizar configuración");
    }
  };

  const addCredits = async () => {
    try {
      await axios.post(
        `${API}/admin/add-credits`,
        { user_id: selectedUser.id, ...creditAction },
        { headers }
      );
      toast.success(`Créditos añadidos a ${selectedUser.username}`);
      fetchUsers();
      setSelectedUser(null);
      setCreditAction({ amount: 0, reason: "" });
    } catch (error) {
      toast.error("Error al añadir créditos");
    }
  };

  const removeCredits = async () => {
    try {
      await axios.post(
        `${API}/admin/remove-credits`,
        { user_id: selectedUser.id, ...creditAction },
        { headers }
      );
      toast.success(`Créditos removidos de ${selectedUser.username}`);
      fetchUsers();
      setSelectedUser(null);
      setCreditAction({ amount: 0, reason: "" });
    } catch (error) {
      toast.error("Error al remover créditos");
    }
  };

  const createProduct = async () => {
    try {
      await axios.post(`${API}/admin/products`, newProduct, { headers });
      toast.success("Producto creado");
      fetchProducts();
      setNewProduct({ name: "", description: "", price: 0, stock: 0 });
    } catch (error) {
      toast.error("Error al crear producto");
    }
  };

  const updateProduct = async () => {
    try {
      await axios.put(`${API}/admin/products/${editingProduct.id}`, editingProduct, { headers });
      toast.success("Producto actualizado");
      fetchProducts();
      setEditingProduct(null);
    } catch (error) {
      toast.error("Error al actualizar producto");
    }
  };

  const deleteProduct = async (productId) => {
    if (window.confirm("¿Estás seguro de eliminar este producto?")) {
      try {
        await axios.delete(`${API}/admin/products/${productId}`, { headers });
        toast.success("Producto eliminado");
        fetchProducts();
      } catch (error) {
        toast.error("Error al eliminar producto");
      }
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
              <h1 className="text-2xl font-bold text-white">Panel de Administración</h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="users" className="space-y-6">
          <TabsList className="bg-purple-900/50">
            <TabsTrigger value="users" data-testid="users-tab" className="data-[state=active]:bg-purple-600">
              <Users className="w-4 h-4 mr-2" />
              Usuarios
            </TabsTrigger>
            <TabsTrigger value="settings" data-testid="settings-tab" className="data-[state=active]:bg-purple-600">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Configuración
            </TabsTrigger>
            <TabsTrigger value="products" data-testid="products-tab" className="data-[state=active]:bg-purple-600">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Productos
            </TabsTrigger>
          </TabsList>

          {/* Users Tab */}
          <TabsContent value="users" data-testid="users-content">
            <Card className="glass-effect border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Gestión de Usuarios</CardTitle>
                <CardDescription className="text-purple-200">Total de usuarios: {users.length}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-purple-500/30">
                        <TableHead className="text-purple-200">Usuario</TableHead>
                        <TableHead className="text-purple-200">Nombre</TableHead>
                        <TableHead className="text-purple-200">Email</TableHead>
                        <TableHead className="text-purple-200">Créditos</TableHead>
                        <TableHead className="text-purple-200">Rol</TableHead>
                        <TableHead className="text-purple-200">Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {users.map((user) => (
                        <TableRow key={user.id} className="border-purple-500/20" data-testid={`user-row-${user.username}`}>
                          <TableCell className="text-white font-medium">{user.username}</TableCell>
                          <TableCell className="text-purple-200">{user.nombre} {user.apellidos}</TableCell>
                          <TableCell className="text-purple-200">{user.email}</TableCell>
                          <TableCell className="text-yellow-400 font-bold" data-testid={`user-credits-${user.username}`}>{user.credits}</TableCell>
                          <TableCell className="text-purple-200">{user.role}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedUser(user)}
                                    data-testid={`add-credits-button-${user.username}`}
                                    className="border-green-500/50 text-green-400 hover:bg-green-600/30"
                                  >
                                    Añadir
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-purple-950 border-purple-500/50">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">Añadir Créditos a {selectedUser?.username}</DialogTitle>
                                    <DialogDescription className="text-purple-200">
                                      Añade créditos a la cuenta del usuario
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="add-amount" className="text-white">Cantidad</Label>
                                      <Input
                                        id="add-amount"
                                        data-testid="add-credits-amount-input"
                                        type="number"
                                        value={creditAction.amount}
                                        onChange={(e) => setCreditAction({ ...creditAction, amount: parseInt(e.target.value) })}
                                        className="bg-purple-900/30 border-purple-500/50 text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="add-reason" className="text-white">Razón</Label>
                                      <Input
                                        id="add-reason"
                                        data-testid="add-credits-reason-input"
                                        type="text"
                                        value={creditAction.reason}
                                        onChange={(e) => setCreditAction({ ...creditAction, reason: e.target.value })}
                                        className="bg-purple-900/30 border-purple-500/50 text-white"
                                        placeholder="Ej: Bonificación especial"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={addCredits}
                                      data-testid="confirm-add-credits-button"
                                      className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                      Añadir Créditos
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>

                              <Dialog>
                                <DialogTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => setSelectedUser(user)}
                                    data-testid={`remove-credits-button-${user.username}`}
                                    className="border-red-500/50 text-red-400 hover:bg-red-600/30"
                                  >
                                    Quitar
                                  </Button>
                                </DialogTrigger>
                                <DialogContent className="bg-purple-950 border-purple-500/50">
                                  <DialogHeader>
                                    <DialogTitle className="text-white">Quitar Créditos a {selectedUser?.username}</DialogTitle>
                                    <DialogDescription className="text-purple-200">
                                      Remueve créditos de la cuenta del usuario
                                    </DialogDescription>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div>
                                      <Label htmlFor="remove-amount" className="text-white">Cantidad</Label>
                                      <Input
                                        id="remove-amount"
                                        data-testid="remove-credits-amount-input"
                                        type="number"
                                        value={creditAction.amount}
                                        onChange={(e) => setCreditAction({ ...creditAction, amount: parseInt(e.target.value) })}
                                        className="bg-purple-900/30 border-purple-500/50 text-white"
                                      />
                                    </div>
                                    <div>
                                      <Label htmlFor="remove-reason" className="text-white">Razón</Label>
                                      <Input
                                        id="remove-reason"
                                        data-testid="remove-credits-reason-input"
                                        type="text"
                                        value={creditAction.reason}
                                        onChange={(e) => setCreditAction({ ...creditAction, reason: e.target.value })}
                                        className="bg-purple-900/30 border-purple-500/50 text-white"
                                        placeholder="Ej: Violación de términos"
                                      />
                                    </div>
                                  </div>
                                  <DialogFooter>
                                    <Button
                                      onClick={removeCredits}
                                      data-testid="confirm-remove-credits-button"
                                      className="bg-red-600 hover:bg-red-700 text-white"
                                    >
                                      Quitar Créditos
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Settings Tab */}
          <TabsContent value="settings" data-testid="settings-content">
            <Card className="glass-effect border-purple-500/30">
              <CardHeader>
                <CardTitle className="text-white">Configuración del Sistema</CardTitle>
                <CardDescription className="text-purple-200">
                  Ajusta los parámetros de ganancia de créditos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="credit-amount" className="text-white">Cantidad de Créditos por Ganancia</Label>
                    <Input
                      id="credit-amount"
                      data-testid="credit-amount-input"
                      type="number"
                      value={settings.credit_amount}
                      onChange={(e) => setSettings({ ...settings, credit_amount: parseInt(e.target.value) })}
                      className="bg-purple-900/30 border-purple-500/50 text-white"
                    />
                    <p className="text-purple-300 text-sm">Créditos que recibe el usuario cada vez</p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="credit-interval" className="text-white">Intervalo de Tiempo (segundos)</Label>
                    <Input
                      id="credit-interval"
                      data-testid="credit-interval-input"
                      type="number"
                      value={settings.credit_interval}
                      onChange={(e) => setSettings({ ...settings, credit_interval: parseInt(e.target.value) })}
                      className="bg-purple-900/30 border-purple-500/50 text-white"
                    />
                    <p className="text-purple-300 text-sm">Tiempo de espera entre ganancias ({Math.floor(settings.credit_interval / 60)} minutos)</p>
                  </div>
                </div>
                <Button
                  onClick={updateSettings}
                  data-testid="save-settings-button"
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                >
                  Guardar Configuración
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Products Tab */}
          <TabsContent value="products" data-testid="products-content">
            <div className="space-y-6">
              {/* Create Product Card */}
              <Card className="glass-effect border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white flex items-center space-x-2">
                    <Plus className="w-5 h-5" />
                    <span>Crear Nuevo Producto</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="product-name" className="text-white">Nombre del Producto</Label>
                      <Input
                        id="product-name"
                        data-testid="new-product-name-input"
                        type="text"
                        value={newProduct.name}
                        onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                        className="bg-purple-900/30 border-purple-500/50 text-white"
                        placeholder="Ej: Servidor VPS Básico"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-price" className="text-white">Precio (créditos)</Label>
                      <Input
                        id="product-price"
                        data-testid="new-product-price-input"
                        type="number"
                        value={newProduct.price}
                        onChange={(e) => setNewProduct({ ...newProduct, price: parseInt(e.target.value) })}
                        className="bg-purple-900/30 border-purple-500/50 text-white"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-description" className="text-white">Descripción</Label>
                      <Input
                        id="product-description"
                        data-testid="new-product-description-input"
                        type="text"
                        value={newProduct.description}
                        onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                        className="bg-purple-900/30 border-purple-500/50 text-white"
                        placeholder="Descripción del servidor"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="product-stock" className="text-white">Stock</Label>
                      <Input
                        id="product-stock"
                        data-testid="new-product-stock-input"
                        type="number"
                        value={newProduct.stock}
                        onChange={(e) => setNewProduct({ ...newProduct, stock: parseInt(e.target.value) })}
                        className="bg-purple-900/30 border-purple-500/50 text-white"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={createProduct}
                    data-testid="create-product-button"
                    className="mt-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Crear Producto
                  </Button>
                </CardContent>
              </Card>

              {/* Products List */}
              <Card className="glass-effect border-purple-500/30">
                <CardHeader>
                  <CardTitle className="text-white">Productos Existentes</CardTitle>
                  <CardDescription className="text-purple-200">Total: {products.length} productos</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-purple-500/30">
                          <TableHead className="text-purple-200">Nombre</TableHead>
                          <TableHead className="text-purple-200">Descripción</TableHead>
                          <TableHead className="text-purple-200">Precio</TableHead>
                          <TableHead className="text-purple-200">Stock</TableHead>
                          <TableHead className="text-purple-200">Acciones</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {products.map((product) => (
                          <TableRow key={product.id} className="border-purple-500/20" data-testid={`product-row-${product.id}`}>
                            <TableCell className="text-white font-medium">{product.name}</TableCell>
                            <TableCell className="text-purple-200">{product.description}</TableCell>
                            <TableCell className="text-yellow-400 font-bold">{product.price}</TableCell>
                            <TableCell className="text-purple-200">{product.stock}</TableCell>
                            <TableCell>
                              <div className="flex space-x-2">
                                <Dialog>
                                  <DialogTrigger asChild>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => setEditingProduct(product)}
                                      data-testid={`edit-product-button-${product.id}`}
                                      className="border-blue-500/50 text-blue-400 hover:bg-blue-600/30"
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                  </DialogTrigger>
                                  <DialogContent className="bg-purple-950 border-purple-500/50">
                                    <DialogHeader>
                                      <DialogTitle className="text-white">Editar Producto</DialogTitle>
                                    </DialogHeader>
                                    {editingProduct && (
                                      <div className="space-y-4">
                                        <div>
                                          <Label className="text-white">Nombre</Label>
                                          <Input
                                            value={editingProduct.name}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                                            className="bg-purple-900/30 border-purple-500/50 text-white"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-white">Descripción</Label>
                                          <Input
                                            value={editingProduct.description}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                                            className="bg-purple-900/30 border-purple-500/50 text-white"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-white">Precio</Label>
                                          <Input
                                            type="number"
                                            value={editingProduct.price}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, price: parseInt(e.target.value) })}
                                            className="bg-purple-900/30 border-purple-500/50 text-white"
                                          />
                                        </div>
                                        <div>
                                          <Label className="text-white">Stock</Label>
                                          <Input
                                            type="number"
                                            value={editingProduct.stock}
                                            onChange={(e) => setEditingProduct({ ...editingProduct, stock: parseInt(e.target.value) })}
                                            className="bg-purple-900/30 border-purple-500/50 text-white"
                                          />
                                        </div>
                                      </div>
                                    )}
                                    <DialogFooter>
                                      <Button
                                        onClick={updateProduct}
                                        className="bg-blue-600 hover:bg-blue-700 text-white"
                                      >
                                        Guardar Cambios
                                      </Button>
                                    </DialogFooter>
                                  </DialogContent>
                                </Dialog>

                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => deleteProduct(product.id)}
                                  data-testid={`delete-product-button-${product.id}`}
                                  className="border-red-500/50 text-red-400 hover:bg-red-600/30"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
