import { Request, Response } from 'express';
  import { SubcategoryServices } from './subcategory.service';
  import catchAsync from '../../../shared/catchAsync';
  import sendResponse from '../../../shared/sendResponse';
  import { StatusCodes } from 'http-status-codes';
  
  const createSubcategory = catchAsync(async (req: Request, res: Response) => {
    const subcategoryData = req.body;
    const result = await SubcategoryServices.createSubcategory(subcategoryData);
    
    sendResponse(res, {
      statusCode: StatusCodes.CREATED,
      success: true,
      message: 'Subcategory created successfully',
      data: result,
    });
  });
  
  const updateSubcategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const subcategoryData = req.body;
    const result = await SubcategoryServices.updateSubcategory(id, subcategoryData);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Subcategory updated successfully',
      data: result,
    });
  });
  
  const getSingleSubcategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SubcategoryServices.getSingleSubcategory(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Subcategory retrieved successfully',
      data: result,
    });
  });
  
  const getAllSubcategorys = catchAsync(async (req: Request, res: Response) => {
    const result = await SubcategoryServices.getAllSubcategorys();
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Subcategorys retrieved successfully',
      data: result,
    });
  });
  
  const deleteSubcategory = catchAsync(async (req: Request, res: Response) => {
    const { id } = req.params;
    const result = await SubcategoryServices.deleteSubcategory(id);
    
    sendResponse(res, {
      statusCode: StatusCodes.OK,
      success: true,
      message: 'Subcategory deleted successfully',
      data: result,
    });
  });
  
  export const SubcategoryController = {
    createSubcategory,
    updateSubcategory,
    getSingleSubcategory,
    getAllSubcategorys,
    deleteSubcategory,
  };