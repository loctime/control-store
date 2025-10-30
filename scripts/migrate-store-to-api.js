// Script para migrar tienda existente a la API de ControlFile
// Ejecutar en la consola del navegador en la página de admin de la tienda

async function migrateStoreToAPI() {
  try {
    // Obtener datos de la tienda actual
    const storeId = 'Tu8rZw9hsdb8OP4nKIdy'; // Reemplazar con el ID real
    const storeData = {
      id: storeId,
      name: 'Tu Tienda', // Reemplazar con el nombre real
      slug: 'tu-tienda', // Reemplazar con el slug real
      ownerEmail: 'tu-email@gmail.com', // Reemplazar con el email real
      ownerId: 'tu-user-id', // Reemplazar con el user ID real
      config: {
        name: 'Tu Tienda',
        phone: '',
        address: '',
        deliveryFee: 500,
        minOrderAmount: 2000,
        openingHours: 'Lun-Dom 11:00 - 23:00',
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Obtener token de autenticación
    const { getAuth } = await import('firebase/auth');
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Usuario no autenticado');
    }
    
    const token = await user.getIdToken();
    const API_BASE_URL = 'https://controlfile.onrender.com';
    
    // Intentar crear la tienda en la API
    console.log('🔄 Intentando registrar tienda en la API...');
    
    const response = await fetch(`${API_BASE_URL}/api/stores`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(storeData),
    });
    
    if (response.ok) {
      console.log('✅ Tienda registrada exitosamente en la API');
      return true;
    } else {
      const errorData = await response.json();
      console.error('❌ Error registrando tienda:', errorData);
      
      // Si el endpoint no existe, mostrar mensaje informativo
      if (response.status === 404) {
        console.log('ℹ️ La API no tiene endpoint para crear tiendas');
        console.log('ℹ️ Las tiendas se manejan directamente en Firestore');
        console.log('ℹ️ Los endpoints de Google Sheets funcionan con tiendas existentes en Firestore');
        return false;
      }
      
      throw new Error(`Error HTTP ${response.status}: ${errorData.error || response.statusText}`);
    }
  } catch (error) {
    console.error('❌ Error en migración:', error);
    return false;
  }
}

// Ejecutar migración
migrateStoreToAPI().then(success => {
  if (success) {
    console.log('🎉 Migración completada exitosamente');
  } else {
    console.log('ℹ️ La migración no fue necesaria o falló');
  }
});
