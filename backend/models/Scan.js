const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'secaudit-history.json');

// Initialize DB file
if (!fs.existsSync(dbPath)) {
  fs.writeFileSync(dbPath, JSON.stringify([]));
}

function readDB() {
  try {
    return JSON.parse(fs.readFileSync(dbPath, 'utf8'));
  } catch (err) {
    return [];
  }
}

function writeDB(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

const Scan = {
  find: function(query) {
    const data = readDB();
    const filtered = data.filter(item => {
      let match = true;
      for (const key in query) {
        if (item[key] !== query[key]) match = false;
      }
      return match;
    });
    return {
      sort: function(sortObj) {
        // Mock sort by date -1
        filtered.sort((a, b) => new Date(b.scanDate) - new Date(a.scanDate));
        return {
          lean: function() { return Promise.resolve(filtered); }
        };
      }
    };
  },
  findById: function(id) {
    const data = readDB();
    const item = data.find(i => i._id === id);
    return {
      lean: function() { return Promise.resolve(item); }
    };
  },
  findByIdAndDelete: function(id) {
    const data = readDB();
    const index = data.findIndex(i => i._id === id);
    if (index !== -1) {
      const item = data[index];
      data.splice(index, 1);
      writeDB(data);
      return Promise.resolve(item);
    }
    return Promise.resolve(null);
  },
  create: function(doc) {
    const data = readDB();
    const newDoc = {
      ...doc,
      _id: crypto.randomUUID(),
      scanDate: new Date().toISOString()
    };
    data.push(newDoc);
    writeDB(data);
    return Promise.resolve(newDoc);
  }
};

module.exports = Scan;
