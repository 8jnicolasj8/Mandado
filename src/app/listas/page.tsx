'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Plus, Users, User, ArrowRight, CheckCircle2, List, Sparkles } from 'lucide-react';
import { useApp } from '@/lib/context/AppContext';

export default function ListasPage() {
  const { lists, currentProfile, setCurrentListId, currentListId, createList } = useApp();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newListName, setNewListName] = useState('');
  const [isShared, setIsShared] = useState(false);

  const sharedLists = lists.filter((l) => l.is_shared || l.owner_id === null);
  const personalLists = lists.filter(
    (l) => !l.is_shared && l.owner_id !== null && l.owner_id === currentProfile.id
  );

  const handleCreateList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;

    createList(newListName.trim(), isShared);
    setNewListName('');
    setIsShared(false);
    setIsCreateModalOpen(false);
  };

  return (
    <div className="px-4 py-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-black text-gray-900">Listas de Compras</h2>
          <p className="text-xs text-gray-500">Organiza las compras familiares y personales</p>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Lista
        </button>
      </div>

      {/* Shared Family List Section (Highlighted at top) */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <Users className="w-3.5 h-3.5 text-emerald-600" />
          Lista Familiar Compartida
        </div>

        <div className="space-y-2">
          {sharedLists.map((list) => {
            const isActive = currentListId === list.id;

            return (
              <div
                key={list.id}
                className={`p-4 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-emerald-50/80 border-emerald-300 shadow-xs'
                    : 'bg-white border-gray-200 hover:border-emerald-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-gray-900">{list.name}</h3>
                        {isActive && (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-200/70 px-2 py-0.5 rounded-full">
                            Activa
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Toda la familia puede ver y editar
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href="/"
                      onClick={() => setCurrentListId(list.id)}
                      className="p-2 text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"
                    >
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Personal Lists Section */}
      <div className="space-y-2">
        <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 uppercase tracking-wider px-1">
          <User className="w-3.5 h-3.5 text-blue-600" />
          Mis Listas Personales
        </div>

        {personalLists.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-300 p-6 text-center space-y-2">
            <p className="text-xs text-gray-500">No tienes listas personales creadas todavía.</p>
            <button
              onClick={() => {
                setIsShared(false);
                setIsCreateModalOpen(true);
              }}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              + Crear lista personal
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            {personalLists.map((list) => {
              const isActive = currentListId === list.id;

              return (
                <div
                  key={list.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    isActive
                      ? 'bg-blue-50/80 border-blue-300 shadow-xs'
                      : 'bg-white border-gray-200 hover:border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                        <List className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-bold text-gray-900">{list.name}</h3>
                          {isActive && (
                            <span className="text-[10px] font-bold text-blue-700 bg-blue-200/70 px-2 py-0.5 rounded-full">
                              Activa
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">Solo visible para ti</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Link
                        href={`/listas/${list.id}`}
                        onClick={() => setCurrentListId(list.id)}
                        className="p-2 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors"
                      >
                        <ArrowRight className="w-5 h-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for creating a new list */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200">
            <h3 className="text-base font-bold text-gray-900 mb-3">Nueva Lista</h3>
            <form onSubmit={handleCreateList} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Nombre de la lista
                </label>
                <div className="flex items-center rounded-xl bg-gray-50 border border-gray-300 focus-within:ring-2 focus-within:ring-emerald-500 focus-within:bg-white overflow-hidden">
                  <span className="pl-3 pr-1 text-sm font-bold text-gray-500 select-none">Lista:</span>
                  <input
                    type="text"
                    placeholder="Familiar, Asado del domingo..."
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    className="w-full px-2 py-2 text-sm bg-transparent border-0 focus:outline-none"
                    required
                    autoFocus
                  />
                </div>
                <p className="text-[10px] text-gray-400 mt-1">
                  Se guardará como &ldquo;Lista: {newListName.replace(/^lista\s*:?\s*/i, '').trim() || '...'}&rdquo;
                </p>
              </div>

              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl border border-gray-200">
                <input
                  type="checkbox"
                  id="shareCheck"
                  checked={isShared}
                  onChange={(e) => setIsShared(e.target.checked)}
                  className="w-4 h-4 text-emerald-600 rounded-sm focus:ring-emerald-500"
                />
                <label htmlFor="shareCheck" className="text-xs text-gray-700 font-medium">
                  Compartir con toda la familia
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-xl"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs"
                >
                  Crear Lista
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
