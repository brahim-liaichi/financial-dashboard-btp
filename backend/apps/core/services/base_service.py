# backend/apps/core/services/base_service.py

from typing import TypeVar, Generic, List, Optional
from django.db import models
from ..exceptions import ValidationError

# Generic type for models
T = TypeVar('T', bound=models.Model)

class BaseService(Generic[T]):
    """
    Base service class providing common functionality for all services.
    
    Generic Type:
        T: Django model class
    """
    model_class: type[T]

    def __init__(self, model_class: type[T]):
        self.model_class = model_class

    async def get_by_id(self, id: int) -> Optional[T]:
        """
        Retrieve a model instance by ID.
        
        Args:
            id: Primary key of the model
            
        Returns:
            Optional model instance
        """
        try:
            return await self.model_class.objects.aget(id=id)
        except self.model_class.DoesNotExist:
            return None

    async def create(self, **kwargs) -> T:
        """
        Create a new model instance.
        
        Args:
            **kwargs: Model field values
            
        Returns:
            Created model instance
        """
        instance = self.model_class(**kwargs)
        await instance.asave()
        return instance

    async def update(self, instance: T, **kwargs) -> T:
        """
        Update a model instance.
        
        Args:
            instance: Model instance to update
            **kwargs: Updated field values
            
        Returns:
            Updated model instance
        """
        for key, value in kwargs.items():
            setattr(instance, key, value)
        await instance.asave()
        return instance

    async def delete(self, instance: T) -> None:
        """
        Delete a model instance.
        
        Args:
            instance: Model instance to delete
        """
        await instance.adelete()