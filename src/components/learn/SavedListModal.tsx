import React from 'react';
import { SavedData, TempSavedData } from '../common/Sidebar';

interface SavedListModalProps {
    savedData: (SavedData | TempSavedData)[];
    onClose: () => void;
    onToggleType: () => void;
    isTemporary: boolean;
}

const SavedListModal: React.FC<SavedListModalProps> = ({
    savedData,
    onClose,
    onToggleType,
    isTemporary
}) => {
    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <div className="modal-dialog">
                <div className="modal-content">
                    <div className="modal-header">
                        <h5 className="modal-title">
                            {isTemporary ? '임시저장 목록' : '저장 목록'}
                        </h5>
                        <button
                            type="button"
                            className="btn-close"
                            onClick={onClose}
                        ></button>
                    </div>
                    <div className="modal-body">
                        <div className="mb-3">
                            <button
                                className="btn btn-outline-secondary"
                                onClick={onToggleType}
                            >
                                {isTemporary ? '저장 목록 보기' : '임시저장 목록 보기'}
                            </button>
                        </div>
                        <div className="list-group">
                            {savedData.map((item) => (
                                <div
                                    key={item.id}
                                    className="list-group-item list-group-item-action"
                                >
                                    <div className="d-flex w-100 justify-content-between">
                                        <h6 className="mb-1">레벨 {item.level} - 단계 {item.step}</h6>
                                        <small className="text-muted">
                                            {new Date(item.timestamp).toLocaleString()}
                                        </small>
                                    </div>
                                    <p className="mb-1">{item.content}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SavedListModal; 